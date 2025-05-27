import path from "path";
import { RuneServer } from "../server/server";
import { HotReloadServer } from "./hot-reload";
import { FileWatcher } from "./file-watcher";

export interface DevServerOptions {
  port?: number;
  host?: string;
  pagesDir?: string;
  apiDir?: string;
  publicDir?: string;
  dev?: boolean;
  hotReloadPort?: number;
}

export async function startDevServer(options: DevServerOptions = {}) {
  const config = {
    port: 3000,
    host: "localhost",
    dev: true,
    hotReloadPort: 3001,
    pagesDir: path.join(process.cwd(), "src/pages"),
    apiDir: path.join(process.cwd(), "src/api"),
    publicDir: path.join(process.cwd(), "public"),
    ...options,
  };

  console.log("🚀 Starting Rune development server...");
  console.log(`📁 Pages: ${config.pagesDir}`);
  console.log(`🔧 API: ${config.apiDir}`);
  console.log(`📦 Public: ${config.publicDir}`);

  // Hot Reload 서버 먼저 시작
  const hotReloadServer = new HotReloadServer({
    port: config.hotReloadPort,
  });

  try {
    await hotReloadServer.start();
    const actualHotReloadPort = hotReloadServer.getPort();

    // 서버 생성 시 실제 hot reload 포트 전달
    const server = new RuneServer({
      ...config,
      hotReloadPort: actualHotReloadPort,
    });

    // 파일 감시 시작
    const fileWatcher = new FileWatcher({
      pagesDir: config.pagesDir,
      apiDir: config.apiDir,
      publicDir: config.publicDir,
      onFileChange: (filePath, changeType) => {
        const ext = path.extname(filePath);

        console.log(
          `📝 File ${changeType}: ${path.relative(process.cwd(), filePath)}`,
        );

        // TypeScript/JSX 파일 변경시 전체 새로고침
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
          try {
            // 모듈 캐시 삭제
            const absolutePath = path.resolve(filePath);
            if (require.cache[absolutePath]) {
              delete require.cache[absolutePath];
              console.log(`🗑️  Cleared cache for: ${path.basename(filePath)}`);
            }

            // 라우트 다시 스캔
            server.rescanRoutes();

            // 브라우저 새로고침
            hotReloadServer.reload(`${changeType}: ${path.basename(filePath)}`);
          } catch (error) {
            console.error(`❌ Error processing file change:`, error);
            hotReloadServer.reload(`Error: ${error.message}`);
          }
        }

        // CSS 파일 변경시 CSS만 새로고침
        else if ([".css", ".scss", ".sass"].includes(ext)) {
          hotReloadServer.reloadCSS();
        }

        // 기타 파일 변경시 전체 새로고침
        else {
          hotReloadServer.reload(`${changeType}: ${path.basename(filePath)}`);
        }
      },
    });

    fileWatcher.start();

    // 개발용 미들웨어 추가
    server.use(async (req, res, next) => {
      res.setHeader("X-Powered-By", "Rune UI");
      await next();
    });

    // 서버 시작
    const httpServer = server.start();

    console.log(`✨ Server running at http://${config.host}:${config.port}`);
    console.log(`🔥 Hot reload on port ${actualHotReloadPort}`);
    console.log("Press Ctrl+C to stop");

    // 종료 처리
    const shutdown = async () => {
      console.log("\n🛑 Shutting down dev server...");

      try {
        fileWatcher.stop();
        await hotReloadServer.stop();
        server.stop();
        process.exit(0);
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
