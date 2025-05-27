import express from "express";
import path from "path";
import type { RuneServerOptions, RuneMiddleware } from "../types";
import { RuneRouter } from "../routing/router";
import { PageScanner } from "../routing/page-scanner";
import { ApiScanner } from "../routing/api-scanner";
import { MiddlewareChain, builtinMiddlewares } from "./middleware";
import { PageRenderer } from "../pages/renderer";
import { createApiHandler } from "../api/handler";
import { HotReloadServer } from "../dev/hot-reload";

export class RuneServer {
  private app: express.Application;
  private router: RuneRouter;
  private pageScanner: PageScanner;
  private apiScanner: ApiScanner;
  private middlewareChain: MiddlewareChain;
  private pageRenderer: PageRenderer;
  private server?: any;
  private hotReloadServer?: HotReloadServer;

  constructor(private options: RuneServerOptions = {}) {
    this.app = express();
    this.router = new RuneRouter();
    this.middlewareChain = new MiddlewareChain();
    this.pageRenderer = new PageRenderer(options.dev);

    // 기본 옵션 설정
    this.options = {
      port: 3000,
      dev: process.env.NODE_ENV !== "production",
      pagesDir: path.join(process.cwd(), "src/pages"),
      apiDir: path.join(process.cwd(), "src/api"),
      publicDir: path.join(process.cwd(), "public"),
      buildDir: path.join(process.cwd(), "dist"),
      ...options,
    };

    // 스캐너 초기화
    this.pageScanner = new PageScanner(
      this.router,
      this.options.pagesDir!,
      this.options.dev,
    );
    this.apiScanner = new ApiScanner(
      this.router,
      this.options.apiDir!,
      this.options.dev,
    );

    this.setupServer();

    // 개발 모드에서 핫 리로드 서버 초기화
    if (this.options.dev) {
      this.hotReloadServer = new HotReloadServer({
        port: 3001, // 기본 핫 리로드 포트
      });
    }
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

    // 정적 파일 서빙
    if (this.options.publicDir) {
      this.middlewareChain.use(
        builtinMiddlewares.static(this.options.publicDir),
      );
    }

    // 압축 미들웨어
    this.middlewareChain.use(builtinMiddlewares.compression());

    // Express 미들웨어 적용
    this.app.use(this.middlewareChain.toExpressMiddleware());

    // 라우트 스캔
    this.scanRoutes();

    // 클라이언트 스크립트 제공
    this.setupClientScript();

    // API 라우트 처리
    this.setupApiRoutes();

    // 페이지 라우트 처리
    this.setupPageRoutes();

    // 404 핸들러
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

    // 개발 모드에서만 Hot Reload 스크립트 제공
    if (this.options.dev) {
      this.app.get("/__hot_reload__.js", (req, res) => {
        res.setHeader("Content-Type", "application/javascript");
        //   const hotReloadScript = `
        //   ${require("fs").readFileSync(path.join(__dirname, "../client/hot-reload-client.js"), "utf8")}
        // `;
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
          console.log(`❌ No API route match found for: ${fullPath}`);
          // 등록된 모든 API 라우트 출력 (디버깅용)
          const routes = this.router.getRoutes();
          console.log(
            `📋 Available API routes:`,
            routes.apis.map((r) => r.path),
          );
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

            const html = await this.pageRenderer.renderPage(
              module.default as any,
              { params, query, pathname },
              req,
              res,
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
    // ${this.options.dev ? this.getHotReloadCode() : ""}
  `;

    return `
// Rune UI Client Runtime
(function() {
  'use strict';

  console.log('🎯 Rune UI Client initialized');

  // 전역 상태 초기화
  window.__RUNE__ = {
    data: window.__RUNE_DATA__ || {},
    router: null,
    hydrator: null,
    hotReload: null
  };

  ${clientModules}

  // 클라이언트 초기화
  function initializeClient() {
    try {
      // 하이드레이터 초기화
      window.__RUNE__.hydrator = new RuneHydrator();

      // 라우터 초기화
      window.__RUNE__.router = new RuneClientRouter();

      // 개발 모드에서 핫 리로드 초기화
      ${this.options.dev ? "window.__RUNE__.hotReload = new HotReloadClient();" : ""}

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
    // 실제로는 빌드된 client.js 파일을 읽어올 수 있지만,
    // 지금은 간단히 인라인으로 포함
    return `
    // RuneClientRouter 구현 (간소화 버전)
    class RuneClientRouter {
      constructor() {
        this.isNavigating = false;
        this.currentRoute = window.location.pathname;
        this.setupEventListeners();
      }

      setupEventListeners() {
        document.addEventListener('click', this.handleLinkClick.bind(this));
        window.addEventListener('popstate', this.handlePopState.bind(this));
      }

      handleLinkClick(event) {
        const target = event.target.closest('a');
        if (!target || !target.href) return;

        if (
          !target.href.startsWith(window.location.origin) ||
          target.hasAttribute('download') ||
          target.hasAttribute('target') ||
          target.hasAttribute('data-no-spa')
        ) {
          return;
        }

        event.preventDefault();
        this.navigate(target.href);
      }

      handlePopState(event) {
        this.navigate(window.location.href, false);
      }

      async navigate(url, pushState = true) {
        if (this.isNavigating) return;
        this.isNavigating = true;

        try {
          const parsedUrl = new URL(url);
          if (parsedUrl.pathname === this.currentRoute && !parsedUrl.search) {
            this.isNavigating = false;
            return;
          }

          this.showLoadingIndicator();

          const response = await fetch(url, {
            headers: {
              'Accept': 'text/html',
              'X-Requested-With': 'spa-navigation'
            }
          });

          if (!response.ok) throw new Error(\`HTTP \${response.status}\`);

          const html = await response.text();
          await this.updatePage(html, url, pushState);
          this.currentRoute = parsedUrl.pathname;

        } catch (error) {
          console.error('Navigation error:', error);
          window.location.href = url;
        } finally {
          this.isNavigating = false;
          this.hideLoadingIndicator();
        }
      }

      async updatePage(html, url, pushState) {
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');
        const newContent = newDoc.querySelector('#__rune_root__');
        const currentContent = document.querySelector('#__rune_root__');

        if (!newContent || !currentContent) {
          throw new Error('Page content containers not found');
        }

        // 페이드 전환
        // currentContent.style.opacity = '0';
        // currentContent.style.transition = 'opacity 150ms ease-out';

        setTimeout(() => {
          currentContent.innerHTML = newContent.innerHTML;

          // 스크립트 처리
          const scriptTags = newDoc.querySelectorAll('script');
          scriptTags.forEach(script => {
            if (script.textContent && script.textContent.includes('__RUNE_DATA__')) {
              try { eval(script.textContent); } catch (e) {}
            }
          });

          // 메타 태그 업데이트
          if (newDoc.title) document.title = newDoc.title;

          currentContent.style.opacity = '1';
          setTimeout(() => currentContent.style.transition = '', 150);

          if (pushState) {
            history.pushState({ url }, '', url);
          }

          window.scrollTo(0, 0);

          // 하이드레이션 다시 실행
          if (window.__RUNE__.hydrator) {
            window.__RUNE__.hydrator.hydrate();
          }
        }, 0);
      }

      showLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = '__rune_loading__';
        indicator.style.cssText = \`
          position: fixed; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #0070f3, #00d4ff);
          z-index: 10000;
          animation: rune-loading 1s ease-in-out infinite;
        \`;

        if (!document.querySelector('#__rune_loading_styles__')) {
          const style = document.createElement('style');
          style.id = '__rune_loading_styles__';
          style.textContent = \`
            @keyframes rune-loading {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0%); }
              100% { transform: translateX(100%); }
            }
          \`;
          document.head.appendChild(style);
        }

        document.body.appendChild(indicator);
      }

      hideLoadingIndicator() {
        const indicator = document.querySelector('#__rune_loading__');
        if (indicator) indicator.remove();
      }
    }
  `;
  }

  /**
   * 하이드레이터 코드 반환
   */
  private getHydratorCode(): string {
    return `
    // RuneHydrator 구현 (간소화 버전)
    class RuneHydrator {
      constructor() {
        this.hydrated = false;
        this.components = new Map();
      }

      async hydrate() {
        if (this.hydrated) return;

        try {
          console.log('🚰 Starting hydration...');

          const serverData = window.__RUNE_DATA__ || {};
          const elements = Array.from(document.querySelectorAll('[data-rune-component]'));

          for (const element of elements) {
            await this.hydrateElement(element, serverData);
          }

          this.hydrated = true;
          window.dispatchEvent(new CustomEvent('rune:hydration-complete'));
          console.log('✅ Hydration completed');

        } catch (error) {
          console.error('❌ Hydration failed:', error);
        }
      }

      async hydrateElement(element, serverData) {
        // 기본적인 이벤트 바인딩
        const clickHandlers = element.querySelectorAll('[onclick]');
        clickHandlers.forEach(el => {
          const handler = el.getAttribute('onclick');
          if (handler) {
            el.onclick = new Function('event', handler);
          }
        });
      }
    }
  `;
  }

  /**
   * 핫 리로드 코드 반환
   */
  private getHotReloadCode(): string {
    const hotReloadPort = this.options.hotReloadPort || 3001;

    return `
// Hot Reload Client Script for Rune UI
(function() {
  'use strict';

  console.log('🔥 Hot Reload Client initializing...');

  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  const reconnectInterval = 1000;
  let isConnected = false;

  function connect() {
    try {
      ws = new WebSocket('ws://localhost:${hotReloadPort}');

      ws.onopen = function() {
        console.log('🔥 Hot reload connected');
        reconnectAttempts = 0;
        isConnected = true;
        hideConnectionError();
      };

      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Hot reload message error:', error);
        }
      };

      ws.onclose = function() {
        isConnected = false;
        console.log('🔌 Hot reload disconnected');

        if (reconnectAttempts < maxReconnectAttempts) {
          showConnectionError();
          setTimeout(function() {
            reconnectAttempts++;
            console.log('🔄 Reconnecting... (' + reconnectAttempts + '/' + maxReconnectAttempts + ')');
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = function(error) {
        console.error('Hot reload error:', error);
        isConnected = false;
      };

    } catch (error) {
      console.error('Failed to connect to hot reload server:', error);
      showConnectionError('Hot reload server unavailable');
    }
  }

  function handleMessage(message) {
    console.log('🔥 Hot reload message:', message);

    switch (message.type) {
      case 'connected':
        console.log('🔌 Hot reload established');
        break;

      case 'reload':
        console.log('🔄 Reloading page: ' + message.reason);
        showNotification('🔄 ' + (message.reason || 'Page reloading...'));

        // Rune 페이지 리로드
        reloadRunePage(message.reason);
        break;

      case 'css-reload':
        console.log('🎨 Reloading CSS');
        reloadCSS();
        showNotification('🎨 CSS reloaded');
        break;

      case 'error':
        console.error('Hot reload error:', message.message);
        showNotification('❌ ' + message.message, 'error');
        break;
    }
  }

  /**
   * Rune 페이지 리로드 처리
   */
  function reloadRunePage(reason) {
    try {
      // 1. 새로운 페이지 데이터 페치
      fetch(window.location.href, {
        headers: {
          'Accept': 'text/html',
          'X-Hot-Reload': 'true'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch updated page');
        }
        return response.text();
      })
      .then(html => {
        // 2. HTML 파싱
        const parser = new DOMParser();
        const newDoc = parser.parseFromString(html, 'text/html');

        // 3. 새로운 데이터 추출
        const newDataScript = newDoc.querySelector('script');
        let newRuneData = {};
        if (newDataScript && newDataScript.textContent.includes('__RUNE_DATA__')) {
          const match = newDataScript.textContent.match(/window\\.__RUNE_DATA__\\s*=\\s*({[^;]+});/);
          if (match) {
            try {
              newRuneData = JSON.parse(match[1]);
            } catch (e) {
              console.warn('Failed to parse new Rune data:', e);
            }
          }
        }

        // 4. 새로운 HTML 컨텐츠 추출
        const newContent = newDoc.querySelector('#__rune_root__');
        if (!newContent) {
          throw new Error('New content not found');
        }

        // 5. 기존 컨텐츠 업데이트
        const currentContent = document.querySelector('#__rune_root__');
        if (currentContent) {
          // 데이터 업데이트
          window.__RUNE_DATA__ = newRuneData;

          // HTML 업데이트
          currentContent.innerHTML = newContent.innerHTML;

          // 6. **중요: Rune redraw 호출**
          triggerRuneRedraw();

          // 7. 메타데이터 업데이트
          if (newDoc.title !== document.title) {
            document.title = newDoc.title;
          }

          console.log('✅ Page reloaded successfully');
          showNotification('✅ Page updated', 'success');
        }
      })
      .catch(error => {
        console.error('Page reload failed:', error);
        // 실패시 전체 페이지 새로고침
        window.location.reload();
      });

    } catch (error) {
      console.error('Rune page reload error:', error);
      window.location.reload();
    }
  }

  /**
   * Rune 컴포넌트들 redraw 트리거
   */
  function triggerRuneRedraw() {
    try {
      // 1. 전역 Rune 인스턴스들 찾기
      if (window.Rune && typeof window.Rune.redraw === 'function') {
        console.log('🎯 Triggering global Rune redraw');
        window.Rune.redraw();
        return;
      }

      // 2. 페이지의 모든 Rune View 인스턴스 찾아서 redraw
      const runeElements = document.querySelectorAll('[data-rune-view]');
      runeElements.forEach(element => {
        const viewInstance = element.__runeView;
        if (viewInstance && typeof viewInstance.redraw === 'function') {
          console.log('🎯 Redrawing Rune view:', viewInstance.constructor.name);
          viewInstance.redraw();
        }
      });

      // 3. 전역 redraw 함수가 있다면 호출
      if (typeof window.redraw === 'function') {
        console.log('🎯 Calling global redraw function');
        window.redraw();
      }

      // 4. 커스텀 이벤트 발생 (애플리케이션에서 리스닝 가능)
      window.dispatchEvent(new CustomEvent('rune:hot-reload', {
        detail: {
          reason: 'file-changed',
          data: window.__RUNE_DATA__
        }
      }));

      console.log('🎯 Rune redraw completed');

    } catch (error) {
      console.error('Rune redraw failed:', error);
      // redraw 실패시 전체 새로고침
      window.location.reload();
    }
  }

  function reloadCSS() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(function(link) {
      const href = link.href;
      const url = new URL(href);
      url.searchParams.set('_reload', Date.now().toString());
      link.href = url.toString();
    });
  }

  function showNotification(message, type) {
    type = type || 'info';

    const notification = document.createElement('div');
    notification.style.cssText =
      'position: fixed; top: 20px; right: 20px; ' +
      'background: ' + (type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3') + '; ' +
      'color: white; padding: 12px 16px; border-radius: 6px; ' +
      'z-index: 10000; font-family: system-ui, sans-serif; ' +
      'font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); ' +
      'max-width: 300px; word-wrap: break-word; ' +
      'transition: all 0.3s ease; opacity: 0; transform: translateY(-10px);';

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function() {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(function() {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(function() {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, type === 'error' ? 5000 : 3000);
  }

  function showConnectionError(message) {
    message = message || 'Hot reload disconnected';

    const existing = document.getElementById('hot-reload-error');
    if (existing) {
      existing.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.id = 'hot-reload-error';
    errorDiv.style.cssText =
      'position: fixed; top: 0; left: 0; right: 0; ' +
      'background: #ff9800; color: white; padding: 8px; ' +
      'text-align: center; z-index: 10001; ' +
      'font-family: system-ui, sans-serif; font-size: 13px; ' +
      'box-shadow: 0 2px 4px rgba(0,0,0,0.1);';

    errorDiv.textContent = '⚠️ ' + message + ' - Hot reload temporarily unavailable';
    document.body.appendChild(errorDiv);
  }

  function hideConnectionError() {
    const errorDiv = document.getElementById('hot-reload-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  // DOM 로드 후 연결 시작
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }

  // 전역 객체에 hot reload 정보 추가
  window.__HOT_RELOAD__ = {
    isConnected: function() { return isConnected; },
    reconnect: connect,
    disconnect: function() {
      if (ws) {
        ws.close();
      }
    },
    triggerRedraw: triggerRuneRedraw
  };

})();
  `;
  }

  //   /**
  //    * 클라이언트 스크립트 생성
  //    */
  //   private generateClientScript(): string {
  //     const hotReloadScript = this.options.dev
  //       ? `
  //   // Hot Reload 클라이언트
  //   class HotReloadClient {
  //     constructor() {
  //       this.connect();
  //     }

  //     connect() {
  //       const ws = new WebSocket('ws://localhost:3001');

  //       ws.onopen = () => {
  //         console.log('🔥 Hot reload connected');
  //       };

  //       ws.onmessage = (event) => {
  //         try {
  //           const message = JSON.parse(event.data);
  //           this.handleMessage(message);
  //         } catch (error) {
  //           console.error('Hot reload message error:', error);
  //         }
  //       };

  //       ws.onclose = () => {
  //         console.log('🔥 Hot reload disconnected, retrying...');
  //         // 재연결 시도
  //         setTimeout(() => this.connect(), 1000);
  //       };

  //       ws.onerror = (error) => {
  //         console.error('Hot reload error:', error);
  //       };

  //       // 주기적으로 ping 전송
  //       setInterval(() => {
  //         if (ws.readyState === WebSocket.OPEN) {
  //           ws.send(JSON.stringify({ type: 'ping' }));
  //         }
  //       }, 30000);
  //     }

  //     handleMessage(message) {
  //       console.log('🔥 Hot reload message:', message);

  //       switch (message.type) {
  //         case 'page-reload':
  //           // 페이지 새로고침
  //           this.reloadPage();
  //           break;

  //         case 'full-reload':
  //           // 전체 페이지 새로고침
  //           window.location.reload();
  //           break;

  //         case 'file-changed':
  //           // 파일 변경 알림만 표시
  //           this.showNotification(\`File changed: \${message.filePath}\`);
  //           break;

  //         case 'error':
  //           // 에러 표시
  //           this.showError(message.message);
  //           break;
  //       }
  //     }

  //     reloadPage() {
  //       // 현재 페이지 새로고침 (SPA 방식)
  //       if (window.__RUNE__.router) {
  //         window.__RUNE__.router.navigate(window.location.href, false);
  //       } else {
  //         window.location.reload();
  //       }
  //     }

  //     showNotification(message) {
  //       // 간단한 알림 표시
  //       const notification = document.createElement('div');
  //       notification.style.cssText = \`
  //         position: fixed;
  //         top: 20px;
  //         right: 20px;
  //         background: #4CAF50;
  //         color: white;
  //         padding: 10px 15px;
  //         border-radius: 4px;
  //         z-index: 10000;
  //         font-family: system-ui, sans-serif;
  //         font-size: 14px;
  //         box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  //       \`;
  //       notification.textContent = message;
  //       document.body.appendChild(notification);

  //       setTimeout(() => {
  //         if (notification.parentNode) {
  //           notification.parentNode.removeChild(notification);
  //         }
  //       }, 3000);
  //     }

  //     showError(message) {
  //       // 에러 알림 표시
  //       const notification = document.createElement('div');
  //       notification.style.cssText = \`
  //         position: fixed;
  //         top: 20px;
  //         right: 20px;
  //         background: #f44336;
  //         color: white;
  //         padding: 10px 15px;
  //         border-radius: 4px;
  //         z-index: 10000;
  //         font-family: system-ui, sans-serif;
  //         font-size: 14px;
  //         box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  //         max-width: 300px;
  //       \`;
  //       notification.textContent = message;
  //       document.body.appendChild(notification);

  //       setTimeout(() => {
  //         if (notification.parentNode) {
  //           notification.parentNode.removeChild(notification);
  //         }
  //       }, 5000);
  //     }
  //   }
  //   `
  //       : "";

  //     return `
  // // Rune UI Client Script
  // (function() {
  //   console.log('🎯 Rune UI Client initialized');

  //   // 전역 상태
  //   window.__RUNE__ = {
  //     data: window.__RUNE_DATA__ || {},
  //     router: null,
  //     hotReload: null
  //   };

  //   // 간단한 클라이언트 사이드 라우팅 (SPA 지원)
  //   class RuneClientRouter {
  //     constructor() {
  //       this.setupNavigation();
  //     }

  //     setupNavigation() {
  //       // 링크 클릭 인터셉트
  //       document.addEventListener('click', (e) => {
  //         const target = e.target.closest('a');
  //         if (target && target.href && target.href.startsWith(window.location.origin)) {
  //           e.preventDefault();
  //           this.navigate(target.href);
  //         }
  //       });

  //       // 브라우저 뒤로가기/앞으로가기
  //       window.addEventListener('popstate', (e) => {
  //         this.navigate(window.location.href, false);
  //       });
  //     }

  //     navigate(url, pushState = true) {
  //       fetch(url, {
  //         headers: {
  //           'Accept': 'text/html'
  //         }
  //       })
  //       .then(response => response.text())
  //       .then(html => {
  //         // 새 페이지 내용으로 업데이트
  //         const parser = new DOMParser();
  //         const newDoc = parser.parseFromString(html, 'text/html');
  //         const newContent = newDoc.querySelector('#__rune_root__');
  //         const currentContent = document.querySelector('#__rune_root__');

  //         if (newContent && currentContent) {
  //           currentContent.innerHTML = newContent.innerHTML;

  //           // 새 데이터 업데이트
  //           const scriptTags = newDoc.querySelectorAll('script');
  //           scriptTags.forEach(script => {
  //             if (script.textContent.includes('__RUNE_DATA__')) {
  //               eval(script.textContent);
  //             }
  //           });

  //           // URL 업데이트
  //           if (pushState) {
  //             history.pushState({}, '', url);
  //           }

  //           // 제목 업데이트
  //           document.title = newDoc.title;
  //         }
  //       })
  //       .catch(error => {
  //         console.error('Navigation error:', error);
  //         // 실패시 전체 페이지 새로고침
  //         window.location.href = url;
  //       });
  //     }
  //   }

  //   ${hotReloadScript}

  //   // 초기화
  //   if (document.readyState === 'loading') {
  //     document.addEventListener('DOMContentLoaded', () => {
  //       window.__RUNE__.router = new RuneClientRouter();
  //       ${this.options.dev ? "window.__RUNE__.hotReload = new HotReloadClient();" : ""}
  //     });
  //   } else {
  //     window.__RUNE__.router = new RuneClientRouter();
  //     ${this.options.dev ? "window.__RUNE__.hotReload = new HotReloadClient();" : ""}
  //   }
  // })();
  // `;
  //   }

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

    // 핫 리로드 서버 시작
    if (this.hotReloadServer) {
      this.hotReloadServer.start();
    }

    return this.server;
  }

  /**
   * 서버 종료
   */
  stop() {
    if (this.hotReloadServer) {
      this.hotReloadServer.stop();
    }

    if (this.server) {
      this.server.close();
    }
  }
}
