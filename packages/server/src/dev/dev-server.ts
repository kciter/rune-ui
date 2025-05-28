import path from "path";
import fs from "fs-extra"; // fs-extra 추가
import { glob } from "glob"; // glob 추가
import esbuild from "esbuild"; // esbuild 추가
import { RuneServer } from "../server/server";
import { HotReloadServer } from "./hot-reload";
import { FileWatcher } from "./file-watcher";

export interface DevServerOptions {
  port?: number;
  host?: string;
  pagesDir?: string;
  apiDir?: string;
  publicDir?: string;
  buildDir?: string; // buildDir 추가
  dev?: boolean;
  hotReloadPort?: number;
  clientAssetsPrefix?: string; // clientAssetsPrefix 추가 (RuneServer로 전달용)
}

// DevServer 내부에서 사용할 구체적인 설정 타입
interface DevServerConfig extends Required<Omit<DevServerOptions, "dev">> {
  // dev는 항상 true
  dev: true;
}

// Export된 컴포넌트 이름들을 추출하는 함수
function extractExportedNames(content: string): string[] {
  const exportedNames: string[] = [];

  // export default class/function 패턴
  const defaultExportMatch = content.match(
    /export\s+default\s+(class|function)\s+(\w+)/,
  );
  if (defaultExportMatch) {
    exportedNames.push(defaultExportMatch[2]);
  }

  // export class/function 패턴
  const namedExportMatches = content.matchAll(
    /export\s+(class|function|const|let|var)\s+(\w+)/g,
  );
  for (const match of namedExportMatches) {
    exportedNames.push(match[2]);
  }

  // export { ... } 패턴
  const exportBlockMatches = content.matchAll(/export\s+\{\s*([^}]+)\s*\}/g);
  for (const match of exportBlockMatches) {
    const names = match[1]
      .split(",")
      .map((name) => name.trim().split(" as ")[0].trim());
    exportedNames.push(...names);
  }

  return [...new Set(exportedNames)]; // 중복 제거
}

// Window 등록 코드를 생성하는 함수
function generateRegistrationCode(exportedNames: string[]): string {
  if (exportedNames.length === 0) {
    return "\n// No exports found for auto-registration\n";
  }

  const registrations = exportedNames
    .map(
      (name) =>
        `  if (typeof ${name} !== 'undefined') window.${name} = ${name};`,
    )
    .join("\n");

  return `
// Auto-register exported components to window object
if (typeof window !== 'undefined') {
${registrations}
}
`;
}

async function buildClientPage(
  pagePath: string, // pagesDir 기준 상대 경로 (예: 'test.tsx' 또는 'users/profile.tsx')
  config: DevServerConfig,
) {
  const entryPoint = path.join(config.pagesDir, pagePath);
  const pageName = pagePath.substring(0, pagePath.lastIndexOf(".")); // 'test' 또는 'users/profile'
  const outFile = path.join(config.buildDir, "client", `${pageName}.js`);

  try {
    await fs.ensureDir(path.dirname(outFile)); // 출력 디렉토리 생성 보장
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      outfile: outFile,
      platform: "browser", // 플랫폼을 'browser'로 명시
      format: "esm",
      jsxFactory: "createHtml.h",
      jsxFragment: "createHtml.Fragment",
      external: [
        "express", // 'express'를 명시적으로 external 처리
        // Node.js 내장 모듈들도 external 처리 (클라이언트에서 필요 없는 경우)
        // 기존 로직은 대부분의 내장 모듈을 external로 처리하고 있었으나, 'express'는 내장 모듈이 아님
        ...require("module").builtinModules.filter(
          (m: string) => m !== "fs" && m !== "path" && m !== "os",
        ), // 예시: 클라이언트에서 os, fs, path 등을 사용하지 않는다고 가정
      ],
      loader: { ".tsx": "tsx", ".ts": "ts" },
      sourcemap: true,
      plugins: [
        // @rune-ui/server 모듈을 클라이언트용 가상 모듈로 대체
        {
          name: "replace-server-imports",
          setup(build) {
            build.onResolve({ filter: /^@rune-ui\/server$/ }, (args) => {
              return {
                path: args.path,
                namespace: "rune-server-virtual",
              };
            });

            build.onLoad(
              { filter: /.*/, namespace: "rune-server-virtual" },
              () => {
                return {
                  contents: `
// Virtual @rune-ui/server module for client-side
export class RunePage {
  constructor(props = {}) {
    this.data = props;
  }

  // 클라이언트에서 필요한 최소한의 메서드만 포함
  hydrateFromSSR(element) {
    console.log('💧 RunePage hydrated on client');
    return this;
  }

  static getMetadata() {
    return {
      title: "Default Title",
      description: "Default Description"
    };
  }
}

// View 클래스도 최소한으로 제공
export class View {
  constructor(props = {}) {
    this.data = props;
  }
}
`,
                  loader: "js",
                };
              },
            );
          },
        },
        // 자동으로 export된 컴포넌트들을 window에 등록하는 플러그인
        {
          name: "auto-register-components",
          setup(build) {
            build.onEnd(async (result) => {
              if (result.errors.length === 0) {
                // 빌드된 파일 읽기
                const content = await fs.readFile(outFile, "utf8");

                // export 구문을 찾아서 동적으로 window 등록 코드 생성
                const exportedNames = extractExportedNames(content);
                const registrationCode =
                  generateRegistrationCode(exportedNames);

                const modifiedContent = content + registrationCode;

                await fs.writeFile(outFile, modifiedContent);
              }
            });
          },
        },
      ],
      // define: { 'process.env.NODE_ENV': JSON.stringify(config.dev ? 'development' : 'production') },
    });
    // console.log(`✅ Built client page: ${pageName}.js`);
  } catch (e) {
    console.error(`❌ Error building client page ${pagePath}:`, e);
  }
}

async function buildAllClientPages(config: DevServerConfig) {
  console.log("🛠️ Building all client pages...");
  const pageFiles = glob.sync("**/*.tsx", { cwd: config.pagesDir });
  for (const pageFile of pageFiles) {
    await buildClientPage(pageFile, config);
  }
  console.log("✅ All client pages built.");
}

export async function startDevServer(options: DevServerOptions = {}) {
  // options에서 dev를 분리하여 config.dev가 항상 true가 되도록 합니다.
  // 나머지 옵션들은 기본값을 가지거나 options에서 가져옵니다.
  const {
    dev: _ignoredDevOption, // DevServerConfig는 dev: true를 강제하므로 options.dev는 무시합니다.
    port = 3000,
    host = "localhost",
    hotReloadPort = 3001,
    pagesDir = path.join(process.cwd(), "src/pages"),
    apiDir = path.join(process.cwd(), "src/api"),
    publicDir = path.join(process.cwd(), "public"),
    buildDir = path.join(process.cwd(), "dist"),
    clientAssetsPrefix = "/assets",
    ...otherPassedOptions // 혹시 모를 추가 옵션들 (현재 DevServerOptions에 없는)
  } = options;

  const config: DevServerConfig = {
    port,
    host,
    dev: true, // DevServerConfig 타입에 따라 항상 true로 설정
    hotReloadPort,
    pagesDir,
    apiDir,
    publicDir,
    buildDir,
    clientAssetsPrefix,
    ...otherPassedOptions, // DevServerConfig에 정의되지 않은 추가 옵션이 있다면 여기서 포함
  };

  console.log("🚀 Starting Rune development server...");
  console.log(`📁 Pages: ${config.pagesDir}`);
  console.log(`🔧 API: ${config.apiDir}`);
  console.log(`📦 Public: ${config.publicDir}`);
  console.log(`🏗️ Build Dir: ${config.buildDir}`);
  console.log(`🖼️ Client Assets Prefix: ${config.clientAssetsPrefix}`);

  // Hot Reload 서버 먼저 시작
  const hotReloadServer = new HotReloadServer({
    port: config.hotReloadPort,
  });

  try {
    await hotReloadServer.start();
    const actualHotReloadPort = hotReloadServer.getPort();

    // 초기 클라이언트 페이지 빌드
    await buildAllClientPages(config);

    // 서버 생성 시 실제 hot reload 포트 및 buildDir, clientAssetsPrefix 전달
    const server = new RuneServer({
      port: config.port,
      dev: config.dev,
      pagesDir: config.pagesDir,
      apiDir: config.apiDir,
      publicDir: config.publicDir,
      buildDir: config.buildDir, // RuneServer에 buildDir 전달
      clientAssetsPrefix: config.clientAssetsPrefix, // RuneServer에 clientAssetsPrefix 전달
      hotReloadPort: actualHotReloadPort,
    });

    // 파일 감시 시작
    const fileWatcher = new FileWatcher({
      pagesDir: config.pagesDir,
      apiDir: config.apiDir,
      publicDir: config.publicDir,
      // buildDir 내의 client 디렉토리도 감시 대상에서 제외하는 것이 좋을 수 있음 (무한 루프 방지)
      // ignored: [path.join(config.buildDir, 'client', '**')],
      onFileChange: async (filePath, changeType) => {
        // async로 변경
        const ext = path.extname(filePath);
        const relativePath = path.relative(process.cwd(), filePath);

        console.log(`📝 File ${changeType}: ${relativePath}`);

        // TypeScript/JSX 파일 변경시
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
          try {
            // 페이지 디렉토리 내의 TSX 파일 변경 시 해당 클라이언트 페이지만 다시 빌드
            if (ext === ".tsx" && filePath.startsWith(config.pagesDir)) {
              const pageRelativePath = path.relative(config.pagesDir, filePath);
              console.log(`🔄 Rebuilding client page: ${pageRelativePath}`);
              await buildClientPage(pageRelativePath, config); // await 추가
            }

            // 모듈 캐시 삭제 (서버 측 코드 변경 대응)
            const absolutePath = path.resolve(filePath);
            if (require.cache[absolutePath]) {
              delete require.cache[absolutePath];
              console.log(`🗑️  Cleared server cache for: ${relativePath}`);
            }

            // 라우트 다시 스캔 (서버 측 코드 변경 대응)
            server.rescanRoutes();

            // 브라우저 새로고침
            hotReloadServer.reload(`${changeType}: ${path.basename(filePath)}`);
          } catch (error) {
            console.error(`❌ Error processing file change:`, error);
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            hotReloadServer.reload(`Error: ${errorMessage}`);
          }
        }
        // ... (기존 CSS 및 기타 파일 처리 로직) ...
        else if ([".css", ".scss", ".sass"].includes(ext)) {
          hotReloadServer.reloadCSS();
        } else {
          hotReloadServer.reload(`${changeType}: ${path.basename(filePath)}`);
        }
      },
    });

    fileWatcher.start();

    // ... (기존 미들웨어 및 서버 시작 로직) ...
    server.use(async (req, res, next) => {
      res.setHeader("X-Powered-By", "Rune UI");
      await next();
    });

    const httpServer = server.start();

    console.log(`✨ Server running at http://${config.host}:${config.port}`);
    console.log(`🔥 Hot reload on port ${actualHotReloadPort}`);
    console.log("Press Ctrl+C to stop");

    // ... (기존 종료 처리 로직) ...
    let shuttingDown = false;
    const shutdown = async () => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;

      console.log("\\n🛑 Shutting down dev server...");

      try {
        fileWatcher.stop();
        await hotReloadServer.stop();
        server.stop();
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    return { server, httpServer, fileWatcher, hotReloadServer };
  } catch (error) {
    console.error("❌ Failed to start development server:", error);
    process.exit(1);
  }
}
