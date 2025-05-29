import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs-extra";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export interface RuneMiddleware {
  (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}

export interface RuneMiddlewareConfig {
  path: string;
  options?: Record<string, any>;
}

export interface MiddlewareConfig {
  path: string;
  middleware: RuneMiddleware;
}

export class MiddlewareManager {
  private middlewares: MiddlewareConfig[] = [];
  private builtinMiddlewares: Map<string, () => RuneMiddleware> = new Map();

  constructor() {
    this.initBuiltinMiddlewares();
  }

  private initBuiltinMiddlewares() {
    // CORS 미들웨어
    this.builtinMiddlewares.set("cors", () => {
      return (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Methods",
          "GET,PUT,POST,DELETE,OPTIONS",
        );
        res.header(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, Content-Length, X-Requested-With",
        );

        if (req.method === "OPTIONS") {
          res.sendStatus(200);
        } else {
          next();
        }
      };
    });

    // 로깅 미들웨어
    this.builtinMiddlewares.set("logging", () => {
      return (req, res, next) => {
        const start = Date.now();
        res.on("finish", () => {
          const duration = Date.now() - start;
          console.log(
            `📄 ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`,
          );
        });
        next();
      };
    });

    // 보안 미들웨어
    this.builtinMiddlewares.set("security", () => {
      return (req, res, next) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("X-XSS-Protection", "1; mode=block");
        next();
      };
    });
  }

  async loadMiddlewares(
    middlewareConfigs: (string | RuneMiddlewareConfig)[],
  ): Promise<void> {
    this.middlewares = [];

    for (const config of middlewareConfigs) {
      try {
        if (typeof config === "string") {
          // 내장 미들웨어 또는 파일 경로
          if (this.builtinMiddlewares.has(config)) {
            const middlewareFactory = this.builtinMiddlewares.get(config)!;
            this.middlewares.push({
              path: `builtin:${config}`,
              middleware: middlewareFactory(),
            });
            console.log(`✅ Built-in middleware loaded: ${config}`);
            continue;
          }

          // 파일 경로로 처리
          await this.loadCustomMiddleware(config);
        } else {
          // 옵션이 있는 미들웨어 설정
          await this.loadCustomMiddleware(config.path, config.options);
        }
      } catch (error) {
        console.error(`❌ Error loading middleware:`, error);
      }
    }
  }

  private async loadCustomMiddleware(
    middlewarePath: string,
    options?: Record<string, any>,
  ): Promise<void> {
    // 상대 경로를 절대 경로로 변환
    const absolutePath = path.isAbsolute(middlewarePath)
      ? middlewarePath
      : path.resolve(process.cwd(), middlewarePath);

    if (!(await fs.pathExists(absolutePath))) {
      console.warn(`⚠️ Middleware file not found: ${absolutePath}`);
      return;
    }

    console.log(`🔧 Loading middleware: ${path.basename(absolutePath)}`);

    // 캐시에서 제거 (개발 모드에서 핫 리로드를 위해)
    if (require.cache[absolutePath]) {
      delete require.cache[absolutePath];
    }

    let middlewareModule;

    if (absolutePath.endsWith(".ts")) {
      // TypeScript 미들웨어
      try {
        require("esbuild-register/dist/node").register({
          extensions: [".ts"],
          format: "cjs",
        });
        middlewareModule = require(absolutePath);
      } catch (error) {
        console.error(
          `❌ Failed to load TypeScript middleware: ${absolutePath}`,
          error,
        );
        return;
      }
    } else {
      // JavaScript 미들웨어
      middlewareModule = require(absolutePath);
    }

    const middlewareFactory = middlewareModule.default || middlewareModule;

    if (typeof middlewareFactory !== "function") {
      console.error(`❌ Middleware must be a function: ${absolutePath}`);
      return;
    }

    // 미들웨어가 팩토리 함수인지 직접 미들웨어인지 확인
    let middleware: RuneMiddleware;

    // 팩토리 함수인 경우 (옵션을 받는 경우)
    if (middlewareFactory.length === 0 || options) {
      middleware = middlewareFactory(options || {});
    } else {
      // 직접 미들웨어 함수인 경우
      middleware = middlewareFactory;
    }

    if (typeof middleware !== "function") {
      console.error(
        `❌ Middleware factory must return a function: ${absolutePath}`,
      );
      return;
    }

    this.middlewares.push({
      path: absolutePath,
      middleware,
    });

    console.log(`✅ Middleware loaded: ${path.basename(absolutePath)}`);
  }

  getMiddlewares(): RuneMiddleware[] {
    return this.middlewares.map((config) => config.middleware);
  }

  async reloadMiddleware(changedPath: string): Promise<void> {
    // 특정 미들웨어만 다시 로드
    const middlewareConfig = this.middlewares.find(
      (config) => config.path === changedPath,
    );
    if (!middlewareConfig) return;

    try {
      console.log(`🔄 Reloading middleware: ${path.basename(changedPath)}`);

      // 캐시에서 제거
      if (require.cache[changedPath]) {
        delete require.cache[changedPath];
      }

      let middlewareModule;

      if (changedPath.endsWith(".ts")) {
        require("esbuild-register/dist/node").register({
          extensions: [".ts"],
          format: "cjs",
        });
        middlewareModule = require(changedPath);
      } else {
        middlewareModule = require(changedPath);
      }

      const middleware = middlewareModule.default || middlewareModule;

      if (typeof middleware === "function") {
        middlewareConfig.middleware = middleware;
        console.log(`✅ Middleware reloaded: ${path.basename(changedPath)}`);
      }
    } catch (error) {
      console.error(`❌ Error reloading middleware ${changedPath}:`, error);
    }
  }

  // 모든 미들웨어 정보 출력 (디버깅용)
  printMiddlewares(): void {
    console.log(`📋 Loaded middlewares (${this.middlewares.length}):`);
    this.middlewares.forEach((config, index) => {
      console.log(`  ${index + 1}. ${path.basename(config.path)}`);
    });
  }
}
