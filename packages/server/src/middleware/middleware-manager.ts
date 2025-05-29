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

  async loadMiddlewares(
    middlewareConfigs: (string | RuneMiddlewareConfig)[],
  ): Promise<void> {
    this.middlewares = [];

    for (const config of middlewareConfigs) {
      try {
        if (typeof config === "string") {
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
}
