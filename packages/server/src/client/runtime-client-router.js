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

    // 새 페이지의 클라이언트 스크립트 찾기 및 로드
    const newScripts = newDoc.querySelectorAll('script[src*="/__rune/"]');
    for (const script of newScripts) {
      if (
        script.src &&
        script.src.includes("/__rune/") &&
        script.src.endsWith(".js")
      ) {
        // 이미 로드된 스크립트인지 확인
        const existingScript = document.querySelector(
          `script[src="${script.src}"]`,
        );
        if (!existingScript) {
          console.log("🔄 Loading new page script:", script.src);
          await this.loadScript(script.src);
        }
      }
    }

    console.log("✅ All scripts loaded, updating DOM...");

    // 스크립트 로드 완료 후 DOM 업데이트
    currentContent.innerHTML = newContent.innerHTML;

    // 스크립트 처리
    const scriptTags = newDoc.querySelectorAll("script");
    scriptTags.forEach((script) => {
      if (script.textContent && script.textContent.includes("__RUNE_DATA__")) {
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

    console.log("✅ DOM updated, starting hydration...");

    // 스크립트 로드 완료 후 잠시 기다려서 컴포넌트 등록이 완료되도록 함
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 하이드레이션 다시 실행 (스크립트 로드 완료 후)
    if (window.__RUNE__.hydrator) {
      window.__RUNE__.hydrator.hydrate();
    }
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

  // 스크립트를 동적으로 로드하는 메서드
  async loadScript(src) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("🔄 Loading script as ES6 module:", src);

        // ES6 모듈로 동적 import 시도
        const module = await import(src + "?t=" + Date.now());
        console.log("✅ ES6 module loaded successfully:", src);
        console.log("📦 Module exports:", Object.keys(module));

        // 모듈의 export된 컴포넌트들을 window에 등록
        Object.entries(module).forEach(([name, component]) => {
          if (
            typeof component === "function" &&
            (name.endsWith("Component") || name.endsWith("Page"))
          ) {
            window[name] = component;
            console.log(`🔗 Registered ${name} to window object`);
          }
        });

        // 새로 로드된 컴포넌트들이 window에 등록되었는지 확인
        const newComponents = Object.keys(window).filter(
          (key) => key.endsWith("Component") || key.endsWith("Page"),
        );
        console.log(
          "🔍 Components available after script load:",
          newComponents,
        );

        resolve();
      } catch (error) {
        console.warn(
          "⚠️ ES6 import failed, falling back to script tag:",
          error.message,
        );

        // ES6 import 실패 시 일반 스크립트 태그로 fallback
        const script = document.createElement("script");
        script.src = src;
        script.type = "module";
        script.async = true;

        script.onload = () => {
          console.log("✅ Script loaded successfully (fallback):", src);

          // 새로 로드된 컴포넌트들이 window에 등록되었는지 확인
          const newComponents = Object.keys(window).filter(
            (key) => key.endsWith("Component") || key.endsWith("Page"),
          );
          console.log(
            "🔍 Components available after script load (fallback):",
            newComponents,
          );

          resolve();
        };

        script.onerror = () => {
          console.error("❌ Failed to load script (fallback):", src);
          reject(new Error(`Failed to load script: ${src}`));
        };

        document.head.appendChild(script);
      }
    });
  }
}
