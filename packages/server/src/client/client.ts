/**
 * 클라이언트 사이드 라우터
 */
export class RuneClientRouter {
  private routes: Map<string, RouteHandler> = new Map();
  private currentRoute: string | null = null;
  private isNavigating: boolean = false;

  constructor() {
    this.setupEventListeners();
    this.handleInitialRoute();
  }

  /**
   * 라우트 핸들러 등록
   */
  addRoute(pattern: string, handler: RouteHandler) {
    this.routes.set(pattern, handler);
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners() {
    // 링크 클릭 인터셉트
    document.addEventListener("click", this.handleLinkClick.bind(this));

    // 브라우저 뒤로가기/앞으로가기
    window.addEventListener("popstate", this.handlePopState.bind(this));

    // 폼 제출 인터셉트 (향후 확장용)
    document.addEventListener("submit", this.handleFormSubmit.bind(this));
  }

  /**
   * 링크 클릭 처리
   */
  private handleLinkClick(event: Event) {
    const target = (event.target as Element)?.closest("a") as HTMLAnchorElement;

    if (!target || !target.href) return;

    // 외부 링크나 특별한 속성이 있는 링크는 무시
    if (
      !target.href.startsWith(window.location.origin) ||
      target.hasAttribute("download") ||
      target.hasAttribute("target") ||
      target.hasAttribute("data-no-spa")
    ) {
      return;
    }

    event.preventDefault();
    this.navigate(target.href);
  }

  /**
   * 브라우저 네비게이션 처리
   */
  private handlePopState(event: PopStateEvent) {
    this.navigate(window.location.href, false);
  }

  /**
   * 폼 제출 처리 (향후 확장용)
   */
  private handleFormSubmit(event: Event) {
    // 현재는 기본 동작 유지
    // 향후 SPA 폼 제출 기능 추가 가능
  }

  /**
   * 초기 라우트 처리
   */
  private handleInitialRoute() {
    this.currentRoute = window.location.pathname;
  }

  /**
   * 페이지 네비게이션
   */
  async navigate(url: string, pushState: boolean = true): Promise<void> {
    if (this.isNavigating) return;

    this.isNavigating = true;

    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;

      // 같은 페이지면 스킵
      if (pathname === this.currentRoute && !parsedUrl.search) {
        this.isNavigating = false;
        return;
      }

      // 로딩 상태 표시
      // this.showLoadingIndicator();

      // 서버에서 새 페이지 데이터 가져오기
      const response = await fetch(url, {
        headers: {
          Accept: "text/html",
          "X-Requested-With": "spa-navigation",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // 페이지 업데이트
      await this.updatePage(html, url, pushState);

      this.currentRoute = pathname;
    } catch (error) {
      console.error("Navigation error:", error);
      this.handleNavigationError(error, url);
    } finally {
      this.isNavigating = false;
      this.hideLoadingIndicator();
    }
  }

  /**
   * 페이지 콘텐츠 업데이트
   */
  private async updatePage(
    html: string,
    url: string,
    pushState: boolean,
  ): Promise<void> {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(html, "text/html");

    // 새 페이지의 루트 요소
    const newContent = newDoc.querySelector("#__rune_root__");
    const currentContent = document.querySelector("#__rune_root__");

    if (!newContent || !currentContent) {
      throw new Error("Page content containers not found");
    }

    // 페이지 전환 애니메이션
    // await this.animatePageTransition(currentContent, newContent);

    // 스크립트 태그 처리
    this.processScripts(newDoc);

    // 메타 태그 업데이트
    this.updateMetaTags(newDoc);

    // URL 및 히스토리 업데이트
    if (pushState) {
      history.pushState({ url }, "", url);
    }

    // 스크롤 위치 초기화
    window.scrollTo(0, 0);

    // 페이지 변경 이벤트 발생
    this.dispatchPageChangeEvent(url);
  }

  /**
   * 페이지 전환 애니메이션
   */
  private async animatePageTransition(
    currentContent: Element,
    newContent: Element,
  ): Promise<void> {
    return new Promise((resolve) => {
      resolve();
      // 페이드 아웃
      // currentContent.style.opacity = "0";
      // currentContent.style.transition = "opacity 150ms ease-out";

      // setTimeout(() => {
      //   // 콘텐츠 교체
      //   currentContent.innerHTML = newContent.innerHTML;

      //   // 페이드 인
      //   currentContent.style.opacity = "1";

      //   setTimeout(() => {
      //     currentContent.style.transition = "";
      //     resolve();
      //   }, 150);
      // }, 150);
    });
  }

  /**
   * 스크립트 태그 처리
   */
  private processScripts(newDoc: Document) {
    const scriptTags = newDoc.querySelectorAll("script");

    scriptTags.forEach((script) => {
      // __RUNE_DATA__ 업데이트
      if (script.textContent?.includes("__RUNE_DATA__")) {
        try {
          eval(script.textContent);
        } catch (error) {
          console.error("Error processing page data:", error);
        }
      }
    });
  }

  /**
   * 메타 태그 업데이트
   */
  private updateMetaTags(newDoc: Document) {
    // 제목 업데이트
    const newTitle = newDoc.title;
    if (newTitle) {
      document.title = newTitle;
    }

    // 메타 태그 업데이트
    const metaTags = [
      "description",
      "keywords",
      "og:title",
      "og:description",
      "og:image",
    ];

    metaTags.forEach((name) => {
      const newMeta = newDoc.querySelector(
        `meta[name="${name}"], meta[property="${name}"]`,
      );
      const currentMeta = document.querySelector(
        `meta[name="${name}"], meta[property="${name}"]`,
      );

      if (newMeta) {
        if (currentMeta) {
          currentMeta.setAttribute(
            "content",
            newMeta.getAttribute("content") || "",
          );
        } else {
          document.head.appendChild(newMeta.cloneNode(true));
        }
      }
    });
  }

  /**
   * 로딩 인디케이터 표시
   */
  private showLoadingIndicator() {
    const indicator = document.createElement("div");
    indicator.id = "__rune_loading__";
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #0070f3, #00d4ff);
      z-index: 10000;
      animation: __rune_loading_animation__ 1s ease-in-out infinite;
    `;

    // CSS 애니메이션 추가
    if (!document.querySelector("#__rune_loading_styles__")) {
      const style = document.createElement("style");
      style.id = "__rune_loading_styles__";
      style.textContent = `
        @keyframes __rune_loading_animation__ {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(indicator);
  }

  /**
   * 로딩 인디케이터 숨김
   */
  private hideLoadingIndicator() {
    const indicator = document.querySelector("#__rune_loading__");
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * 네비게이션 에러 처리
   */
  private handleNavigationError(error: any, url: string) {
    console.error(
      "SPA navigation failed, falling back to full page load:",
      error,
    );

    // 전체 페이지 새로고침으로 폴백
    window.location.href = url;
  }

  /**
   * 페이지 변경 이벤트 발생
   */
  private dispatchPageChangeEvent(url: string) {
    const event = new CustomEvent("rune:page-change", {
      detail: { url, pathname: new URL(url).pathname },
    });
    window.dispatchEvent(event);
  }

  /**
   * 프리페치 (향후 확장용)
   */
  async prefetch(url: string): Promise<void> {
    try {
      await fetch(url, {
        headers: {
          Accept: "text/html",
          "X-Requested-With": "prefetch",
        },
      });
    } catch (error) {
      console.warn("Prefetch failed:", url, error);
    }
  }
}

/**
 * 라우트 핸들러 타입
 */
type RouteHandler = (params: Record<string, string>) => void | Promise<void>;
