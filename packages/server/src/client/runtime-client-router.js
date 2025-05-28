// RuneClientRouter 구현 (간소화 버전)
class RuneClientRouter {
  constructor() {
    this.isNavigating = false;
    this.currentRoute = window.location.pathname;
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("click", this.handleLinkClick.bind(this));
    window.addEventListener("popstate", this.handlePopState.bind(this));
  }

  handleLinkClick(event) {
    const target = event.target.closest("a");
    if (!target || !target.href) return;

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
          Accept: "text/html",
          "X-Requested-With": "spa-navigation",
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      await this.updatePage(html, url, pushState);
      this.currentRoute = parsedUrl.pathname;
    } catch (error) {
      console.error("Navigation error:", error);
      window.location.href = url;
    } finally {
      this.isNavigating = false;
      this.hideLoadingIndicator();
    }
  }

  async updatePage(html, url, pushState) {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(html, "text/html");
    const newContent = newDoc.querySelector("#__rune_root__");
    const currentContent = document.querySelector("#__rune_root__");

    if (!newContent || !currentContent) {
      throw new Error("Page content containers not found");
    }

    // 페이드 전환
    // currentContent.style.opacity = '0';
    // currentContent.style.transition = 'opacity 150ms ease-out';

    setTimeout(() => {
      currentContent.innerHTML = newContent.innerHTML;

      // 스크립트 처리
      const scriptTags = newDoc.querySelectorAll("script");
      scriptTags.forEach((script) => {
        if (
          script.textContent &&
          script.textContent.includes("__RUNE_DATA__")
        ) {
          try {
            eval(script.textContent);
          } catch (e) {}
        }
      });

      // 메타 태그 업데이트
      if (newDoc.title) document.title = newDoc.title;

      currentContent.style.opacity = "1";
      setTimeout(() => (currentContent.style.transition = ""), 150);

      if (pushState) {
        history.pushState({ url }, "", url);
      }

      window.scrollTo(0, 0);

      // 하이드레이션 다시 실행
      if (window.__RUNE__.hydrator) {
        window.__RUNE__.hydrator.hydrate();
      }
    }, 0);
  }

  showLoadingIndicator() {
    const indicator = document.createElement("div");
    indicator.id = "__rune_loading__";
    indicator.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #0070f3, #00d4ff);
      z-index: 10000;
      animation: rune-loading 1s ease-in-out infinite;
    `;

    if (!document.querySelector("#__rune_loading_styles__")) {
      const style = document.createElement("style");
      style.id = "__rune_loading_styles__";
      style.textContent = `
        @keyframes rune-loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(indicator);
  }

  hideLoadingIndicator() {
    const indicator = document.querySelector("#__rune_loading__");
    if (indicator) indicator.remove();
  }
}
