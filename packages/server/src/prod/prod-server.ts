import path from "path";
import { RuneServer } from "../server/server";

export interface ProdServerOptions {
  port: number;
  host: string;
  buildDir: string;
}

/**
 * 프로덕션 서버 시작
 */
export async function startProdServer(options: ProdServerOptions) {
  // 서버 빌드 디렉토리 경로
  const serverDir = path.join(options.buildDir, "server");
  const pagesDir = path.join(serverDir, "pages");
  const apiDir = path.join(serverDir, "api");
  const publicDir = path.join(options.buildDir, "static");
  const clientDir = path.join(options.buildDir, "client");

  // RuneServer 인스턴스 생성 (프로덕션 모드)
  const server = new RuneServer({
    port: options.port,
    dev: false, // 프로덕션 모드
    pagesDir: pagesDir,
    apiDir: apiDir,
    publicDir: publicDir,
    buildDir: options.buildDir,
    clientAssetsPrefix: "/__rune",
    hotReload: false, // 프로덕션에서는 비활성화
  });

  // 서버 시작
  const httpServer = server.start();

  console.log(
    `🚀 Production server started on http://${options.host}:${options.port}`,
  );
  console.log(`📁 Serving from: ${options.buildDir}`);
  console.log(`📱 Client assets: ${clientDir}`);
  console.log(`🖥️  Server pages: ${pagesDir}`);
  console.log(`🔧 API endpoints: ${apiDir}`);
  console.log(`📁 Static files: ${publicDir}`);

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM received, shutting down gracefully...");
    server.stop();
    console.log("✅ Production server stopped");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("🛑 SIGINT received, shutting down gracefully...");
    server.stop();
    console.log("✅ Production server stopped");
    process.exit(0);
  });

  return httpServer;
}
