import fs from "fs";
import path from "path";
import { createRequire } from "module";
import type { Route } from "../types";
import { RuneRouter } from "./router";

export class PageScanner {
  private require: NodeRequire;

  constructor(
    private router: RuneRouter,
    private pagesDir: string,
    private isDev: boolean = false,
  ) {
    // createRequire를 사용하여 require 함수 생성
    this.require = createRequire(import.meta.url);
  }

  /**
   * 페이지 디렉토리 스캔
   */
  scan() {
    if (!fs.existsSync(this.pagesDir)) {
      console.warn(`Pages directory not found: ${this.pagesDir}`);
      return;
    }

    this.scanDirectory(this.pagesDir, "");
  }

  private scanDirectory(dir: string, routePrefix: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // 디렉토리면 재귀적으로 스캔
        const newPrefix = path.posix.join(routePrefix, entry.name);
        this.scanDirectory(fullPath, newPrefix);
      } else if (this.isPageFile(entry.name)) {
        // 페이지 파일 처리
        const route = this.createPageRoute(fullPath, routePrefix, entry.name);
        if (route) {
          const loader = () => this.loadPageModule(fullPath);
          this.router.addPageRoute(route, loader);
          console.log(`📄 Page route: ${route.path} -> ${fullPath}`);
        }
      }
    }
  }

  private isPageFile(filename: string): boolean {
    return /\.(js|ts|jsx|tsx)$/.test(filename) && !filename.startsWith("_");
  }

  private createPageRoute(
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
      routePath = path.posix.join(routePrefix, basename);
    }

    // 빈 경로는 루트로 정규화
    if (routePath === "" || routePath === ".") {
      routePath = "/";
    }

    // 동적 라우트 변환: [param] -> :param
    const convertedPath = this.convertDynamicRoute(routePath);
    const isDynamic = convertedPath !== routePath;
    const params = this.extractParams(convertedPath);

    console.log(
      `📄 Creating page route: ${filename} -> ${convertedPath} (from ${filePath})`,
    );

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

  private async loadPageModule(filePath: string) {
    try {
      console.log(`Loading page module from: ${filePath}`);

      // 개발 모드에서는 캐시 무효화
      if (this.isDev && this.require.cache[this.require.resolve(filePath)]) {
        delete this.require.cache[this.require.resolve(filePath)];
      }

      // require를 사용하여 모듈 로드 (esbuild-register가 처리함)
      const module = this.require(filePath);
      return module;
    } catch (error) {
      console.error(`Failed to load page module: ${filePath}`, error);
      throw error;
    }
  }
}
