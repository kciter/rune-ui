import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import net from "net";

export interface HotReloadOptions {
  port: number;
}

export class HotReloadServer {
  private wss?: WebSocketServer;
  private server?: any;
  private clients: Set<WebSocket> = new Set();
  private actualPort?: number;

  constructor(private options: HotReloadOptions) {}

  /**
   * 사용 가능한 포트 찾기
   */
  private async findAvailablePort(startPort: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();

      server.listen(startPort, () => {
        const port = (server.address() as net.AddressInfo)?.port;
        server.close(() => resolve(port));
      });

      server.on("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          // 포트가 사용 중이면 다음 포트 시도
          resolve(this.findAvailablePort(startPort + 1));
        } else {
          reject(err);
        }
      });
    });
  }

  async start() {
    try {
      // 사용 가능한 포트 찾기
      this.actualPort = await this.findAvailablePort(this.options.port);

      if (this.actualPort !== this.options.port) {
        console.log(
          `⚠️  Port ${this.options.port} is busy, using port ${this.actualPort} instead`,
        );
      }

      // WebSocket 서버 생성
      this.server = createServer();
      this.wss = new WebSocketServer({ server: this.server });

      this.wss.on("connection", (ws) => {
        console.log("🔌 Hot reload client connected");
        this.clients.add(ws);

        ws.on("close", () => {
          console.log("🔌 Hot reload client disconnected");
          this.clients.delete(ws);
        });

        ws.on("error", (error) => {
          console.error("Hot reload WebSocket error:", error);
          this.clients.delete(ws);
        });

        // 연결 확인 메시지
        ws.send(JSON.stringify({ type: "connected" }));
      });

      await new Promise<void>((resolve, reject) => {
        this.server!.listen(this.actualPort, (err?: Error) => {
          if (err) {
            reject(err);
          } else {
            console.log(
              `🔥 Hot reload server running on port ${this.actualPort}`,
            );
            resolve();
          }
        });
      });
    } catch (error) {
      console.error("❌ Failed to start hot reload server:", error);
      throw error;
    }
  }

  stop() {
    return new Promise<void>((resolve) => {
      const cleanup = () => {
        resolve();
      };

      if (this.wss) {
        // 모든 클라이언트 연결 강제 종료
        this.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN ||
            client.readyState === WebSocket.CONNECTING
          ) {
            client.terminate(); // WebSocket 연결 즉시 종료
          }
        });
        this.clients.clear(); // 클라이언트 Set 비우기

        this.wss.close(() => {
          if (this.server) {
            this.server.close(() => {
              cleanup();
            });
          } else {
            cleanup();
          }
        });
      } else {
        cleanup();
      }
    });
  }

  /**
   * Rune 페이지 리로드 신호 전송
   */
  reloadRune(reason?: string) {
    const message = JSON.stringify({
      type: "reload", // 'rune-reload'로 변경 가능
      reason: reason || "File changed",
      timestamp: Date.now(),
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(
      `🎯 Sent Rune reload signal to ${this.clients.size} clients: ${reason}`,
    );
  }

  /**
   * 실제 사용 중인 포트 반환
   */
  getPort(): number | undefined {
    return this.actualPort;
  }

  /**
   * 모든 클라이언트에게 새로고침 신호 전송
   */
  reload(reason?: string) {
    const message = JSON.stringify({
      type: "reload",
      reason: reason || "File changed",
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`🔄 Sent reload signal to ${this.clients.size} clients`);
  }

  /**
   * CSS만 다시 로드 (페이지 새로고침 없이)
   */
  reloadCSS() {
    const message = JSON.stringify({
      type: "css-reload",
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`🎨 Sent CSS reload signal to ${this.clients.size} clients`);
  }
}
