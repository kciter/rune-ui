import path from "path";
import type { Route, PageModule, ApiModule } from "../types";

export class RuneRouter {
  private pageRoutes: Map<string, Route> = new Map();
  private apiRoutes: Map<string, Route> = new Map();
  private pageModules: Map<string, () => Promise<PageModule>> = new Map();
  private apiModules: Map<string, () => Promise<ApiModule>> = new Map();

  /**
   * 페이지 라우트 추가
   */
  addPageRoute(route: Route, loader: () => Promise<PageModule>) {
    this.pageRoutes.set(route.path, route);
    this.pageModules.set(route.path, loader);
  }

  /**
   * API 라우트 추가
   */
  addApiRoute(route: Route, loader: () => Promise<ApiModule>) {
    this.apiRoutes.set(route.path, route);
    this.apiModules.set(route.path, loader);
  }

  /**
   * 경로 매칭
   */
  matchRoute(
    pathname: string,
    routes: Map<string, Route>,
  ): { route: Route; params: Record<string, string> } | null {
    for (const [routePath, route] of routes) {
      const match = this.matchPath(pathname, routePath);
      if (match) {
        return { route, params: match };
      }
    }
    return null;
  }

  /**
   * 페이지 라우트 매칭
   */
  matchPageRoute(pathname: string) {
    return this.matchRoute(pathname, this.pageRoutes);
  }

  /**
   * API 라우트 매칭
   */
  matchApiRoute(pathname: string) {
    return this.matchRoute(pathname, this.apiRoutes);
  }

  /**
   * 페이지 모듈 로드
   */
  async loadPageModule(routePath: string): Promise<PageModule | null> {
    const loader = this.pageModules.get(routePath);
    if (!loader) return null;
    return await loader();
  }

  /**
   * API 모듈 로드
   */
  async loadApiModule(routePath: string): Promise<ApiModule | null> {
    const loader = this.apiModules.get(routePath);
    if (!loader) return null;
    return await loader();
  }

  clear() {
    this.pageRoutes.clear();
    this.apiRoutes.clear();
    this.pageModules.clear();
    this.apiModules.clear();
  }

  /**
   * 경로 패턴 매칭 (동적 라우트 지원)
   */
  private matchPath(
    pathname: string,
    pattern: string,
  ): Record<string, string> | null {
    // 루트 경로 특별 처리
    if (pathname === "/" && pattern === "/") {
      return {};
    }

    const patternParts = pattern.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);

    // 루트 경로의 경우 빈 배열끼리 비교
    if (patternParts.length === 0 && pathParts.length === 0) {
      return {};
    }

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart?.startsWith(":") && pathPart) {
        // 동적 라우트 매개변수
        const paramName = patternPart.slice(1);
        params[paramName] = decodeURIComponent(pathPart);
      } else if (patternPart !== pathPart) {
        // 정적 경로가 일치하지 않음
        return null;
      }
    }

    return params;
  }

  /**
   * 모든 라우트 목록 반환
   */
  getRoutes() {
    return {
      pages: Array.from(this.pageRoutes.values()),
      apis: Array.from(this.apiRoutes.values()),
    };
  }
}
