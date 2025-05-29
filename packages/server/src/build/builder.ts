import path from "path";
import fs from "fs-extra";
import { glob } from "glob";
import esbuild from "esbuild";
import { createRequire } from "module";
import {
  loadConfig,
  resolveConfigPaths,
  RuneConfig,
} from "../config/config-loader";
import { runeJsxEsbuildPlugin } from "@rune-ui/jsx";

export interface BuildOptions {
  outputDir: string;
  pagesDir: string;
  apiDir: string;
  publicDir: string;
  buildDir: string;
  configPath?: string;
  disableConfig?: boolean;
}

interface BuildConfig
  extends Required<Omit<BuildOptions, "configPath" | "disableConfig">> {
  resolvedConfig: RuneConfig;
}

/**
 * 프로덕션 앱 빌드
 */
export async function buildApp(options: BuildOptions) {
  console.log("🏗️  Starting production build...");

  // 설정 파일 로딩
  let userConfig = {};
  if (!options.disableConfig) {
    try {
      const configDir = path.dirname(options.configPath || process.cwd());
      userConfig = await loadConfig(configDir);
      console.log("📋 Loaded configuration");
    } catch (error) {
      console.warn("⚠️  Could not load config file, using defaults");
    }
  }

  const resolvedConfig = resolveConfigPaths(userConfig);

  const config: BuildConfig = {
    outputDir: options.outputDir,
    pagesDir: options.pagesDir,
    apiDir: options.apiDir,
    publicDir: options.publicDir,
    buildDir: options.buildDir,
    resolvedConfig,
  };

  // 출력 디렉토리 정리
  await fs.remove(config.outputDir);
  await fs.ensureDir(config.outputDir);

  // 병렬로 빌드 수행
  await Promise.all([
    buildClientPages(config),
    buildServerPages(config),
    buildServerApis(config),
    copyStaticAssets(config),
  ]);

  console.log("✅ Production build completed!");
  console.log(`📁 Output directory: ${config.outputDir}`);
}

/**
 * 클라이언트 페이지 빌드 (브라우저용)
 */
async function buildClientPages(config: BuildConfig) {
  console.log("🖥️  Building client pages...");

  const clientDir = path.join(config.outputDir, "client");
  await fs.ensureDir(clientDir);

  // 페이지 파일 찾기
  const pageFiles = glob.sync("**/*.{tsx,ts,jsx,js}", { cwd: config.pagesDir });

  if (pageFiles.length === 0) {
    console.log("📄 No pages found to build");
    return;
  }

  const serverPackages = config.resolvedConfig.build?.serverPackages || [];
  const userExternal = config.resolvedConfig.build?.external || [];
  const require = createRequire(import.meta.url);

  // 외부 패키지 목록
  const allExternalPackages = [
    ...serverPackages,
    ...userExternal,
    ...require("module").builtinModules.filter(
      (m: string) => !["path", "url", "util"].includes(m),
    ),
  ];

  // 각 페이지를 개별적으로 빌드
  const buildPromises = pageFiles.map(async (pageFile) => {
    const entryPoint = path.join(config.pagesDir, pageFile);
    const pageName = pageFile.substring(0, pageFile.lastIndexOf("."));
    const outFile = path.join(clientDir, `${pageName}.js`);

    await fs.ensureDir(path.dirname(outFile));

    try {
      await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        outfile: outFile,
        platform: "browser",
        format: "esm",
        target: "es2022",
        minify: config.resolvedConfig.build?.minify ?? true,
        sourcemap: config.resolvedConfig.build?.sourcemap ?? false,
        treeShaking: true,
        splitting: false,
        loader: { ".tsx": "tsx", ".ts": "ts", ".jsx": "jsx", ".js": "js" },
        plugins: [
          runeJsxEsbuildPlugin({
            jsxFactory: "createHtml",
            jsxFragmentFactory: "Fragment",
            importPath: "@rune-ui/jsx",
          }),
          // 서버 전용 패키지를 동적으로 감지하고 external 처리
          {
            name: "dynamic-external-detector",
            setup(build: esbuild.PluginBuild) {
              const serverPackagesSet = new Set(serverPackages);
              const userExternalSet = new Set(userExternal);

              build.onResolve(
                { filter: /.*/ },
                (args: esbuild.OnResolveArgs) => {
                  const packageName = args.path;

                  if (
                    packageName.startsWith(".") ||
                    packageName.startsWith("/")
                  ) {
                    return null;
                  }

                  // @rune-ui/server는 가상 모듈로 대체
                  if (packageName === "@rune-ui/server") {
                    return null;
                  }

                  let basePackageName = packageName;
                  if (packageName.startsWith("@")) {
                    const parts = packageName.split("/");
                    if (parts.length >= 2) {
                      basePackageName = `${parts[0]}/${parts[1]}`;
                    }
                  } else {
                    basePackageName = packageName.split("/")[0]!!;
                  }

                  if (
                    serverPackagesSet.has(basePackageName) ||
                    userExternalSet.has(basePackageName)
                  ) {
                    return {
                      path: packageName,
                      external: true,
                    };
                  }

                  return null;
                },
              );
            },
          },
          // @rune-ui/server 모듈을 클라이언트용 가상 모듈로 대체
          {
            name: "replace-server-imports",
            setup(build: esbuild.PluginBuild) {
              build.onResolve(
                { filter: /^@rune-ui\/server$/ },
                (args: esbuild.OnResolveArgs) => {
                  return {
                    path: args.path,
                    namespace: "rune-server-virtual",
                  };
                },
              );

              build.onLoad(
                { filter: /.*/, namespace: "rune-server-virtual" },
                (args: esbuild.OnLoadArgs) => {
                  return {
                    contents: `
// Virtual @rune-ui/server module for client-side
export class RunePage {
  constructor(props = {}) {
    this.data = props;
  }

  hydrateFromSSR(element) {
    console.log('💧 RunePage hydrated on client');
    return this;
  }

  static getMetadata() {
    return {};
  }
}

export function createApiHandler(handler) {
  return handler;
}

export function createSsrHtml() {
  throw new Error('createSsrHtml is not available on client side');
}

export function setSsrContext() {
  // No-op on client side
}

export function getPropsStore() {
  return new Map();
}
`,
                  };
                },
              );
            },
          },
          // 컴포넌트 자동 등록 플러그인
          {
            name: "auto-register-components",
            setup(build: esbuild.PluginBuild) {
              build.onEnd(async (result: esbuild.BuildResult) => {
                if (result.errors.length === 0) {
                  const content = await fs.readFile(outFile, "utf8");
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
        define: {
          "process.env.NODE_ENV": JSON.stringify("production"),
        },
      });

      console.log(`✅ Built client page: ${pageName}.js`);
    } catch (error) {
      console.error(`❌ Error building client page ${pageFile}:`, error);
      throw error;
    }
  });

  await Promise.all(buildPromises);
  console.log(`📦 Built ${pageFiles.length} client pages`);
}

/**
 * 서버 페이지 빌드 (Node.js용)
 */
async function buildServerPages(config: BuildConfig) {
  console.log("🖥️  Building server pages...");

  const serverDir = path.join(config.outputDir, "server");
  const serverPagesDir = path.join(serverDir, "pages");
  await fs.ensureDir(serverPagesDir);

  // 페이지 파일 찾기
  const pageFiles = glob.sync("**/*.{tsx,ts,jsx,js}", { cwd: config.pagesDir });

  if (pageFiles.length === 0) {
    console.log("📄 No server pages found to build");
    return;
  }

  // 각 페이지를 개별적으로 빌드
  const buildPromises = pageFiles.map(async (pageFile) => {
    const entryPoint = path.join(config.pagesDir, pageFile);
    const outputPath = path.join(
      serverPagesDir,
      pageFile.replace(/\.(tsx|jsx)$/, ".js"),
    );

    await fs.ensureDir(path.dirname(outputPath));

    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: false, // 서버 측은 개별 파일로
      outfile: outputPath,
      platform: "node",
      format: "esm",
      target: "node18",
      minify: config.resolvedConfig.build?.minify ?? true,
      sourcemap: config.resolvedConfig.build?.sourcemap ?? false,
      loader: { ".tsx": "tsx", ".ts": "ts", ".jsx": "jsx", ".js": "js" },
      plugins: [
        runeJsxEsbuildPlugin({
          jsxFactory: "createSsrHtml",
          jsxFragmentFactory: "Fragment",
          importPath: "@rune-ui/server",
        }),
      ],
      external: ["@rune-ui/*", "rune-ts", "express", "fs", "path", "url"],
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    });
  });

  await Promise.all(buildPromises);
  console.log(`📦 Built ${pageFiles.length} server pages`);
}

/**
 * 서버 API 빌드
 */
async function buildServerApis(config: BuildConfig) {
  console.log("🔧 Building server APIs...");

  const serverDir = path.join(config.outputDir, "server");
  const serverApiDir = path.join(serverDir, "api");

  // API 디렉토리가 존재하는지 확인
  if (!fs.existsSync(config.apiDir)) {
    console.log("📄 No API directory found");
    return;
  }

  await fs.ensureDir(serverApiDir);

  // API 파일 찾기
  const apiFiles = glob.sync("**/*.{ts,js}", { cwd: config.apiDir });

  if (apiFiles.length === 0) {
    console.log("📄 No API files found to build");
    return;
  }

  // 각 API 파일을 개별적으로 빌드
  const buildPromises = apiFiles.map(async (apiFile) => {
    const entryPoint = path.join(config.apiDir, apiFile);
    const outputPath = path.join(serverApiDir, apiFile.replace(/\.ts$/, ".js"));

    await fs.ensureDir(path.dirname(outputPath));

    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: false,
      outfile: outputPath,
      platform: "node",
      format: "esm",
      target: "node18",
      minify: config.resolvedConfig.build?.minify ?? true,
      sourcemap: config.resolvedConfig.build?.sourcemap ?? false,
      loader: { ".ts": "ts", ".js": "js" },
      external: ["@rune-ui/*", "rune-ts", "express", "fs", "path", "url"],
      define: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    });
  });

  await Promise.all(buildPromises);
  console.log(`📦 Built ${apiFiles.length} API files`);
}

/**
 * 정적 에셋 복사
 */
async function copyStaticAssets(config: BuildConfig) {
  console.log("📁 Copying static assets...");

  const staticDir = path.join(config.outputDir, "static");
  await fs.ensureDir(staticDir);

  // public 디렉토리가 존재하면 복사
  if (fs.existsSync(config.publicDir)) {
    await fs.copy(config.publicDir, staticDir);
    console.log("📁 Copied public assets");
  } else {
    console.log("📁 No public directory found");
  }
}

// Export된 컴포넌트 이름들을 추출하는 함수
function extractExportedNames(content: string): string[] {
  const exportedNames: string[] = [];

  // export default class/function 패턴
  const defaultExportMatch = content.match(
    /export\s+default\s+(class|function)\s+(\w+)/,
  );
  if (defaultExportMatch && defaultExportMatch[2]) {
    exportedNames.push(defaultExportMatch[2]);
  }

  // export class/function 패턴
  const namedExportMatches = content.matchAll(
    /export\s+(class|function|const|let|var)\s+(\w+)/g,
  );
  for (const match of namedExportMatches) {
    if (match[2]) {
      exportedNames.push(match[2]);
    }
  }

  // export { ... } 패턴
  const exportBlockMatches = content.matchAll(/export\s+\{\s*([^}]+)\s*\}/g);
  for (const match of exportBlockMatches) {
    if (match[1]) {
      const names = match[1]
        .split(",")
        .map((name) => {
          const trimmed = name.trim().split(/\s+as\s+/)[0];
          return trimmed ? trimmed.trim() : "";
        })
        .filter((name) => name && /^\w+$/.test(name));
      exportedNames.push(...names);
    }
  }

  return [...new Set(exportedNames)];
}

// Window 등록 코드를 생성하는 함수
function generateRegistrationCode(exportedNames: string[]): string {
  if (exportedNames.length === 0) {
    return "";
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
