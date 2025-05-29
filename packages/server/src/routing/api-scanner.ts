import fs from "fs";
import path from "path";
import { createRequire } from "module";
import type { Route } from "../types";
import { RuneRouter } from "./router";

export class ApiScanner {
  private require: NodeRequire;

  constructor(
    private router: RuneRouter,
    private apiDir: string,
    private isDev: boolean = false,
  ) {
    // createRequire를 사용하여 require 함수 생성
    this.require = createRequire(import.meta.url);
  }

  /**
   * API 디렉토리 스캔
   */
  scan() {
    if (!fs.existsSync(this.apiDir)) {
      console.warn(`API directory not found: ${this.apiDir}`);
      return;
    }

    this.scanDirectory(this.apiDir, "");
  }

  private scanDirectory(dir: string, routePrefix: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // 디렉토리면 재귀적으로 스캔
        const newPrefix = path.posix.join(routePrefix, entry.name);
        this.scanDirectory(fullPath, newPrefix);
      } else if (this.isApiFile(entry.name)) {
        // API 파일 처리
        const route = this.createApiRoute(fullPath, routePrefix, entry.name);
        if (route) {
          const loader = () => this.loadApiModule(fullPath);
          this.router.addApiRoute(route, loader);
        }
      }
    }
  }

  private isApiFile(filename: string): boolean {
    return /\.(js|ts)$/.test(filename);
  }

  /**
   * API 라우트 생성
   */
  private createApiRoute(
    filePath: string,
    routePrefix: string,
    filename: string,
  ): Route | null {
    const basename = path.basename(filename, path.extname(filename));

    let routePath: string;
    if (basename === "index") {
      // index 파일은 상위 디렉토리의 루트 경로
      routePath = routePrefix || "/";
    } else {
      // 파일명을 경로로 변환
      if (routePrefix) {
        routePath = path.posix.join(routePrefix, basename);
      } else {
        routePath = `/${basename}`;
      }
    }

    // 최종 API 경로 생성 - 여기가 문제였음!
    let finalPath: string;
    if (routePath === "/") {
      finalPath = "/api";
    } else {
      // routePath가 이미 /로 시작하므로 그대로 사용
      finalPath = `/api${routePath}`;
    }

    // 동적 라우트 변환: [param] -> :param
    const convertedPath = this.convertDynamicRoute(finalPath);
    const isDynamic = convertedPath !== finalPath;
    const params = this.extractParams(convertedPath);

    return {
      path: convertedPath,
      filePath,
      isDynamic,
      params,
    };
  }

  private convertDynamicRoute(routePath: string): string {
    return routePath.replace(/\[([^\]]+)\]/g, ":$1");
  }

  private extractParams(routePath: string): string[] {
    const matches = routePath.match(/:([^/]+)/g);
    return matches ? matches.map((match) => match.slice(1)) : [];
  }

  private async loadApiModule(filePath: string) {
    try {
      console.log(`Loading API module from: ${filePath}`);

      // 개발 모드에서는 캐시 무효화
      if (this.isDev && this.require.cache[this.require.resolve(filePath)]) {
        delete this.require.cache[this.require.resolve(filePath)];
      }

      // require를 사용하여 모듈 로드 (esbuild-register가 처리함)
      const module = this.require(filePath);
      return module;
    } catch (error) {
      console.error(`Failed to load API module: ${filePath}`, error);
      throw error;
    }
  }
}
