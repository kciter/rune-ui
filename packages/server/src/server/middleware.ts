import type { Request, Response, NextFunction } from "express";
import type { RuneMiddleware } from "../types";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export class MiddlewareChain {
  private middlewares: RuneMiddleware[] = [];

  /**
   * 미들웨어 추가
   */
  use(middleware: RuneMiddleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Express 미들웨어로 변환
   */
  toExpressMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      let index = 0;

      const runNext = async (): Promise<void> => {
        if (index >= this.middlewares.length) {
          return next();
        }

        const middleware = this.middlewares[index++];

        try {
          await middleware?.(req, res, runNext);
        } catch (error) {
          next(error);
        }
      };

      await runNext();
    };
  }

  /**
   * 기본 미들웨어들 등록
   */
  setupDefaults() {
    // CORS 미들웨어
    this.use(async (req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      );

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
      }

      await next();
    });

    // 로깅 미들웨어
    this.use(async (req, res, next) => {
      const start = Date.now();

      await next();

      const duration = Date.now() - start;
      const status = res.statusCode;
      const statusColor =
        status >= 400 ? "\x1b[31m" : status >= 300 ? "\x1b[33m" : "\x1b[32m";

      console.log(
        `${req.method} ${req.url} ${statusColor}${status}\x1b[0m - ${duration}ms`,
      );
    });

    // Body parser 미들웨어
    this.use(async (req, res, next) => {
      if (req.headers["content-type"]?.includes("application/json")) {
        let body = "";

        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            req.body = body ? JSON.parse(body) : {};
          } catch (error) {
            req.body = {};
          }
          next();
        });
      } else {
        req.body = {};
        await next();
      }
    });
  }
}

/**
 * 내장 미들웨어들
 */
export const builtinMiddlewares = {
  /**
   * 정적 파일 서빙 미들웨어
   */
  static: (publicDir: string): RuneMiddleware => {
    console.log(`📁 Static middleware initialized for: ${publicDir}`);
    return async (req, res, next) => {
      if (req.method !== "GET" || req.url.includes("..")) {
        return next();
      }

      const filePath = path.join(publicDir, req.url);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        const mimeTypes: Record<string, string> = {
          ".html": "text/html",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
          ".ico": "image/x-icon",
          ".txt": "text/plain",
        };

        const mimeType = mimeTypes[ext] || "application/octet-stream";
        res.setHeader("Content-Type", mimeType);

        const content = fs.readFileSync(filePath);
        res.send(content);
        return;
      }

      await next();
    };
  },

  /**
   * 압축 미들웨어
   */
  compression: (): RuneMiddleware => {
    return async (req, res, next) => {
      const acceptEncoding = req.headers["accept-encoding"] || "";

      if (acceptEncoding.includes("gzip")) {
        const originalSend = res.send;

        res.send = function (data: any) {
          if (typeof data === "string" && data.length > 1024) {
            const compressed = zlib.gzipSync(data);

            this.setHeader("Content-Encoding", "gzip");
            this.setHeader("Content-Length", compressed.length);

            return originalSend.call(this, compressed);
          }

          return originalSend.call(this, data);
        };
      }

      await next();
    };
  },
};
