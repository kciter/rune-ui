import express from "express"; // Ensure express is imported
import path from "path"; // Import path module
import * as fs from "fs";
import { RuneRouter } from "../routing/router";
import { PageScanner } from "../routing/page-scanner";
import { ApiScanner } from "../routing/api-scanner";
import { MiddlewareChain, builtinMiddlewares } from "./middleware";
import { PageRenderer } from "../pages/renderer";
import { createApiHandler } from "../api/handler";
import type { RuneMiddleware } from "../types";

// Temporary: Define RuneServerOptions here if not accessible from ../types
interface RuneServerOptions {
  port?: number;
  dev?: boolean;
  pagesDir?: string;
  apiDir?: string;
  publicDir?: string;
  buildDir?: string;
  clientAssetsPrefix?: string;
  hotReloadPort?: number;
}

export class RuneServer {
  private app: express.Application;
  private router: RuneRouter;
  private pageScanner: PageScanner;
  private apiScanner: ApiScanner;
  private middlewareChain: MiddlewareChain;
  private pageRenderer: PageRenderer;
  private server?: any;
  private options: RuneServerOptions; // Declare options type

  constructor(options: RuneServerOptions = {}) {
    // Default options initialization
    this.options = {
      port: 3000,
      dev: process.env.NODE_ENV !== "production",
      pagesDir: path.join(process.cwd(), "src/pages"),
      apiDir: path.join(process.cwd(), "src/api"),
      publicDir: path.join(process.cwd(), "public"),
      buildDir: path.join(process.cwd(), "dist"),
      clientAssetsPrefix: "/assets",
      hotReloadPort: 3001,
      ...options, // Override defaults with user-provided options
    };

    this.app = express();
    this.router = new RuneRouter(); // Initialize router
    this.middlewareChain = new MiddlewareChain(); // Initialize middlewareChain without arguments

    this.pageRenderer = new PageRenderer(
      this.options.dev,
      this.options.pagesDir, // pagesDir will have a default value
      this.options.clientAssetsPrefix,
    );

    // Serve client-side assets from buildDir/client
    // This check ensures buildDir is defined before using it.
    if (this.options.buildDir && this.options.clientAssetsPrefix) {
      const clientBuildDir = path.join(this.options.buildDir, "client");
      // Check if clientBuildDir actually exists before trying to serve it
      if (fs.existsSync(clientBuildDir)) {
        console.log(
          `[RuneServer] Serving client build assets from: ${clientBuildDir} at ${this.options.clientAssetsPrefix}`,
        );
        this.app.use(
          this.options.clientAssetsPrefix,
          express.static(clientBuildDir),
        );
      } else {
        if (this.options.dev) {
          console.warn(
            `[RuneServer] Client build directory does not exist: ${clientBuildDir}. Client assets will not be served. This might be expected if you haven't built the client assets yet.`,
          );
        }
      }
    } else {
      if (this.options.dev) {
        console.warn(
          "[RuneServer] buildDir or clientAssetsPrefix option is not set. Client assets may not be served.",
        );
      }
    }

    // Scanners initialization (moved after router initialization)
    this.pageScanner = new PageScanner(
      this.router, // router is now initialized
      this.options.pagesDir!,
      this.options.dev,
    );
    this.apiScanner = new ApiScanner(
      this.router, // router is now initialized
      this.options.apiDir!,
      this.options.dev,
    );

    this.setupServer();
  }

  /**
   * 사용자 정의 미들웨어 추가
   */
  use(middleware: RuneMiddleware) {
    this.middlewareChain.use(middleware);
    return this;
  }

  /**
   * 서버 설정
   */
  private setupServer() {
    // 기본 미들웨어 설정
    this.middlewareChain.setupDefaults();

    // 정적 파일 서빙 (publicDir)
    if (this.options.publicDir && fs.existsSync(this.options.publicDir)) {
      this.middlewareChain.use(
        builtinMiddlewares.static(this.options.publicDir),
      );
    }

    // Compression middleware
    this.middlewareChain.use(builtinMiddlewares.compression());

    // Apply Express middleware from the chain
    this.app.use(this.middlewareChain.toExpressMiddleware());

    // Scan routes
    this.scanRoutes();

    // Setup client script (main runtime)
    this.setupClientScript();

    // Setup API routes
    this.setupApiRoutes();

    // Setup page routes (should be last for catch-all)
    this.setupPageRoutes();

    // 404 handler (if specific handling is needed beyond page router's 404)
    // this.setup404Handler();
  }

  /**
   * 라우트 스캔
   */
  private scanRoutes() {
    console.log("🔍 Scanning routes...");
    this.pageScanner.scan();
    this.apiScanner.scan();

    const routes = this.router.getRoutes();
    console.log(
      `📊 Found ${routes.pages.length} pages and ${routes.apis.length} API routes`,
    );
  }

  /**
   * 클라이언트 스크립트 설정
   */
  private setupClientScript() {
    this.app.get("/__rune_client__.js", (req, res) => {
      res.setHeader("Content-Type", "application/javascript");
      res.send(this.generateClientScript());
    });

    // Props Store 클라이언트 스크립트 제공
    this.app.get("/props-store.js", (req, res) => {
      res.setHeader("Content-Type", "application/javascript");
      const propsStoreScript = this.getPropsStoreScript();
      res.send(propsStoreScript);
    });

    // 개발 모드에서만 Hot Reload 스크립트 제공
    if (this.options.dev) {
      this.app.get("/__hot_reload__.js", (req, res) => {
        res.setHeader("Content-Type", "application/javascript");
        const hotReloadScript = this.getHotReloadCode();
        res.send(hotReloadScript);
      });
    }
  }

  /**
   * 라우트 다시 스캔 (Hot Reload용)
   */
  rescanRoutes() {
    console.log("🔄 Rescanning routes...");
    this.router.clear(); // 기존 라우트 정리
    this.scanRoutes(); // 다시 스캔
  }

  /**
   * API 라우트 설정
   */
  private setupApiRoutes() {
    this.app.use("/api", async (req, res, next) => {
      const pathname = req.path;

      try {
        // 전체 API 경로로 매칭 시도
        const fullPath = `/api${pathname}`;

        const match = this.router.matchApiRoute(fullPath);

        if (match) {
          const { route, params } = match;
          const module = await this.router.loadApiModule(route.path);

          if (module) {
            // 매개변수를 req.params에 추가
            req.params = { ...req.params, ...params };

            const handler = createApiHandler(module);
            await handler(req, res);
            return;
          } else {
            console.log(
              `❌ Failed to load API module for route: ${route.path}`,
            );
          }
        } else {
          if (this.options.dev) {
            // 개발 모드에서만 상세 로그 출력
            console.log(`❌ No API route match found for: ${fullPath}`);
            const routes = this.router.getRoutes();
            console.log(
              `📋 Available API routes:`,
              routes.apis.map((r) => r.path),
            );
          }
        }

        next(); // API 라우트를 찾지 못했으면 다음으로
      } catch (error) {
        console.error("API route error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  }

  /**
   * 페이지 라우트 설정
   */
  private setupPageRoutes() {
    this.app.use(async (req, res) => {
      const pathname = req.path;

      try {
        const match = this.router.matchPageRoute(pathname);

        if (match) {
          const { route, params } = match;
          const module = await this.router.loadPageModule(route.path);

          if (module && module.default) {
            const query = req.query as Record<string, string>;

            // getServerSideProps 호출하여 props 가져오기
            let pageProps = { params, query, pathname };

            // 인스턴스를 먼저 생성하여 getServerSideProps 호출
            const tempPageInstance = new (module.default as any)(pageProps);

            if (tempPageInstance.getServerSideProps) {
              try {
                const result = await tempPageInstance.getServerSideProps({
                  params,
                  query,
                  req,
                  res,
                });

                if (result && result.props) {
                  // 기본 props와 getServerSideProps의 결과를 병합
                  pageProps = { ...pageProps, ...result.props };
                }
              } catch (error) {
                console.error("getServerSideProps error:", error);
                if (this.options.dev) {
                  // 개발 모드에서는 에러 페이지 렌더링
                  const errorHtml = this.pageRenderer["renderErrorPage"](
                    error,
                    pageProps,
                  );
                  res.status(500).send(errorHtml);
                  return;
                }
                // 프로덕션에서는 기본 props로 계속 진행
              }
            }

            const html = await this.pageRenderer.renderPage(
              module.default as any,
              pageProps,
            );

            res.setHeader("Content-Type", "text/html");
            res.send(html);
            return;
          }
        }

        // 페이지를 찾지 못했으면 404
        res.status(404).send(this.pageRenderer["render404Page"]());
      } catch (error) {
        console.error("Page route error:", error);
        res.status(500).send("Internal Server Error");
      }
    });
  }

  /**
   * 404 핸들러 설정
   */
  private setup404Handler() {
    this.app.use((req, res) => {
      res.status(404).json({ error: "Not Found" });
    });
  }

  /**
   * 클라이언트 스크립트 생성
   */
  private generateClientScript(): string {
    // 클라이언트 모듈들을 인라인으로 포함
    const clientModules = `
    ${this.getClientRouterCode()}
    ${this.getHydratorCode()}
  `; // Hot reload 코드는 별도 파일(/__hot_reload__.js)로 제공되므로 여기서 제외

    return `
// Rune UI Client Runtime
(function() {
  'use strict';

  // 전역 상태 초기화
  window.__RUNE__ = {
    data: window.__RUNE_DATA__ || {},
    router: null,
    hydrator: null,
    hotReload: null // HotReloadClient는 hot-reload-client.js에서 스스로 할당할 수 있음
  };

  ${clientModules}

  // 클라이언트 초기화
  function initializeClient() {
    try {
      // 하이드레이터 초기화
      window.__RUNE__.hydrator = new RuneHydrator();

      // 라우터 초기화
      window.__RUNE__.router = new RuneClientRouter();

      // HotReloadClient 초기화는 /__hot_reload__.js 스크립트가 담당합니다.
      // 예: if (this.options.dev && typeof HotReloadClient !== 'undefined') {
      // window.__RUNE__.hotReload = new HotReloadClient();
      // }

      console.log('✅ Rune UI client ready');

    } catch (error) {
      console.error('❌ Client initialization failed:', error);
    }
  }

  // DOM 준비 시 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeClient);
  } else {
    initializeClient();
  }

})();
`;
  }

  /**
   * 클라이언트 라우터 코드 반환
   */
  private getClientRouterCode(): string {
    const scriptPath = path.join(
      __dirname,
      "../client/runtime-client-router.js",
    );
    return fs.readFileSync(scriptPath, "utf8");
  }

  /**
   * 클라이언트 하이드레이터 코드 반환
   */
  private getHydratorCode(): string {
    const scriptPath = path.join(
      __dirname,
      "../client/runtime-client-hydrator.js",
    );
    return fs.readFileSync(scriptPath, "utf8");
  }

  /**
   * 핫 리로드 클라이언트 코드 반환
   */
  private getHotReloadCode(): string {
    const hotReloadPort = this.options.hotReloadPort || 3001;
    const hotReloadScriptPath = path.join(
      __dirname,
      "../client/hot-reload-client.js",
    );
    try {
      const scriptContent = fs.readFileSync(hotReloadScriptPath, "utf8");
      return scriptContent.replace(
        "%%HOT_RELOAD_PORT%%",
        String(hotReloadPort),
      );
    } catch (error) {
      console.error("Failed to read hot reload client script:", error);
      return "// Failed to load HotReloadClient";
    }
  }

  /**
   * 서버 시작
   */
  start() {
    this.server = this.app.listen(this.options.port, () => {
      console.log(
        `🚀 Rune server running on http://localhost:${this.options.port}`,
      );
      console.log(`📁 Pages: ${this.options.pagesDir}`);
      console.log(`🔧 APIs: ${this.options.apiDir}`);
      console.log(`📦 Public: ${this.options.publicDir}`);
      console.log(
        `🛠️  Mode: ${this.options.dev ? "development" : "production"}`,
      );
    });

    return this.server;
  }

  /**
   * 서버 종료
   */
  stop() {
    if (this.server) {
      this.server.close();
    }
  }

  /**
   * Props Store 클라이언트 스크립트 생성
   */
  private getPropsStoreScript(): string {
    try {
      const propsStorePath = path.join(__dirname, "../client/props-store.js");
      if (fs.existsSync(propsStorePath)) {
        return fs.readFileSync(propsStorePath, "utf-8");
      } else {
        console.warn(`Props Store file not found at: ${propsStorePath}`);
        // 인라인으로 간단한 Props Store 구현 제공
        return `
class PropsStore {
  constructor() {
    this.data = {};
    this.isClient = typeof window !== 'undefined';
  }

  set(id, props) {
    this.data[id] = props;
  }

  get(id) {
    return this.data[id] || {};
  }

  loadFromDOM() {
    if (!this.isClient) return;

    // __RUNE_DATA__ 스크립트 태그에서 컴포넌트 데이터 로드
    const runeDataScripts = document.querySelectorAll('script.__RUNE_DATA__');
    runeDataScripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        if (data && data.name) {
          // 컴포넌트 ID 찾기 - 연관된 element의 data-rune-id 사용
          const componentName = data.name;
          let componentId = null;

          // 같은 클래스를 가진 element 찾기
          const elements = document.querySelectorAll(\`[data-rune="\${componentName}"]\`);
          elements.forEach(element => {
            const id = element.getAttribute('data-rune-id');
            if (id) {
              componentId = id;
              this.data[componentId] = {
                componentName: componentName,
                props: data,
                timestamp: Date.now()
              };
              console.log(\`📦 PropsStore: Loaded data for \${componentName} (\${componentId}):\`, data);
            }
          });
        }
      } catch (e) {
        console.warn('📦 PropsStore: Failed to parse script data:', e);
      }
    });
  }
}

window.PropsStore = PropsStore;
window.__RUNE_PROPS_STORE__ = new PropsStore();

// DOM이 로드되면 자동으로 데이터 로드
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.__RUNE_PROPS_STORE__.loadFromDOM();
  });
} else {
  window.__RUNE_PROPS_STORE__.loadFromDOM();
}
`;
      }
    } catch (error) {
      console.error("Error reading props-store.js:", error);
      return "console.error('Failed to load props store');";
    }
  }
}
