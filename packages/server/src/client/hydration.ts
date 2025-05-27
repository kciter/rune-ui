/**
 * 클라이언트 사이드 하이드레이션
 */
export class RuneHydrator {
  private components: Map<string, ComponentConstructor> = new Map();
  private hydrated: boolean = false;

  constructor() {
    this.setupHydration();
  }

  /**
   * 컴포넌트 등록
   */
  registerComponent(name: string, component: ComponentConstructor) {
    this.components.set(name, component);
  }

  /**
   * 하이드레이션 설정
   */
  private setupHydration() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.hydrate();
      });
    } else {
      this.hydrate();
    }
  }

  /**
   * 페이지 하이드레이션
   */
  async hydrate(): Promise<void> {
    if (this.hydrated) return;

    try {
      console.log("🚰 Starting hydration...");

      // 서버에서 전달된 데이터 가져오기
      const serverData = this.getServerData();

      // 하이드레이션 가능한 컴포넌트 찾기
      const hydrateableElements = this.findHydrateableElements();

      // 각 컴포넌트 하이드레이션
      for (const element of hydrateableElements) {
        await this.hydrateElement(element, serverData);
      }

      this.hydrated = true;

      // 하이드레이션 완료 이벤트
      this.dispatchHydrationComplete();

      console.log("✅ Hydration completed");
    } catch (error) {
      console.error("❌ Hydration failed:", error);
      this.handleHydrationError(error);
    }
  }

  /**
   * 서버 데이터 가져오기
   */
  private getServerData(): any {
    return (window as any).__RUNE_DATA__ || {};
  }

  /**
   * 하이드레이션 가능한 요소 찾기
   */
  private findHydrateableElements(): Element[] {
    // data-rune-component 속성을 가진 요소들 찾기
    return Array.from(document.querySelectorAll("[data-rune-component]"));
  }

  /**
   * 개별 요소 하이드레이션
   */
  private async hydrateElement(
    element: Element,
    serverData: any,
  ): Promise<void> {
    const componentName = element.getAttribute("data-rune-component");
    const componentId = element.getAttribute("data-rune-id");

    if (!componentName) return;

    const ComponentConstructor = this.components.get(componentName);
    if (!ComponentConstructor) {
      console.warn(`Component not found for hydration: ${componentName}`);
      return;
    }

    try {
      // 컴포넌트별 데이터 추출
      const componentData = this.extractComponentData(
        element,
        serverData,
        componentId,
      );

      // 컴포넌트 인스턴스 생성
      const instance = new ComponentConstructor(componentData);

      // 이벤트 리스너 바인딩
      this.bindEventListeners(element, instance);

      // 상태 동기화
      this.syncComponentState(element, instance);

      console.log(`🚰 Hydrated component: ${componentName}`);
    } catch (error) {
      console.error(`Failed to hydrate component ${componentName}:`, error);
    }
  }

  /**
   * 컴포넌트 데이터 추출
   */
  private extractComponentData(
    element: Element,
    serverData: any,
    componentId?: string | null,
  ): any {
    // 요소에서 데이터 속성 추출
    const elementData: any = {};

    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-rune-prop-")) {
        const propName = attr.name.replace("data-rune-prop-", "");
        try {
          elementData[propName] = JSON.parse(attr.value);
        } catch {
          elementData[propName] = attr.value;
        }
      }
    });

    // 서버 데이터와 병합
    const componentData =
      componentId && serverData[componentId]
        ? { ...elementData, ...serverData[componentId] }
        : elementData;

    return componentData;
  }

  /**
   * 이벤트 리스너 바인딩
   */
  private bindEventListeners(element: Element, instance: any): void {
    // 클릭 이벤트
    const clickHandlers = element.querySelectorAll("[data-rune-click]");
    clickHandlers.forEach((el) => {
      const handlerName = el.getAttribute("data-rune-click");
      if (handlerName && typeof instance[handlerName] === "function") {
        el.addEventListener("click", (e) => {
          e.preventDefault();
          instance[handlerName](e);
        });
      }
    });

    // 입력 이벤트
    const inputHandlers = element.querySelectorAll("[data-rune-input]");
    inputHandlers.forEach((el) => {
      const handlerName = el.getAttribute("data-rune-input");
      if (handlerName && typeof instance[handlerName] === "function") {
        el.addEventListener("input", (e) => {
          instance[handlerName](e);
        });
      }
    });

    // 변경 이벤트
    const changeHandlers = element.querySelectorAll("[data-rune-change]");
    changeHandlers.forEach((el) => {
      const handlerName = el.getAttribute("data-rune-change");
      if (handlerName && typeof instance[handlerName] === "function") {
        el.addEventListener("change", (e) => {
          instance[handlerName](e);
        });
      }
    });
  }

  /**
   * 컴포넌트 상태 동기화
   */
  private syncComponentState(element: Element, instance: any): void {
    // Rune의 reactive 시스템과 연동하여 상태 변경 감지
    if (instance.data && typeof instance.data === "object") {
      // 상태 변경 시 DOM 업데이트
      const updateDOM = () => {
        try {
          const newHTML = instance.render();
          if (newHTML !== element.innerHTML) {
            element.innerHTML = newHTML;
            // 이벤트 리스너 재바인딩
            this.bindEventListeners(element, instance);
          }
        } catch (error) {
          console.error("Error updating component DOM:", error);
        }
      };

      // Rune의 reactive system이 있다면 활용
      if (typeof instance.subscribe === "function") {
        instance.subscribe(updateDOM);
      }
    }
  }

  /**
   * 하이드레이션 완료 이벤트
   */
  private dispatchHydrationComplete(): void {
    const event = new CustomEvent("rune:hydration-complete");
    window.dispatchEvent(event);
  }

  /**
   * 하이드레이션 에러 처리
   */
  private handleHydrationError(error: any): void {
    // 에러 리포팅
    const event = new CustomEvent("rune:hydration-error", {
      detail: { error },
    });
    window.dispatchEvent(event);

    // 개발 모드에서 에러 표시
    if (process.env.NODE_ENV === "development") {
      this.showHydrationError(error);
    }
  }

  /**
   * 개발 모드 에러 표시
   */
  private showHydrationError(error: any): void {
    const errorElement = document.createElement("div");
    errorElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      max-width: 400px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    errorElement.innerHTML = `
      <strong>🚰 Hydration Error</strong><br>
      ${error.message || error}
      <button onclick="this.parentElement.remove()" style="
        float: right;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
        margin-top: -5px;
      ">×</button>
    `;

    document.body.appendChild(errorElement);

    // 5초 후 자동 제거
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
    }, 5000);
  }
}

/**
 * 컴포넌트 생성자 타입
 */
type ComponentConstructor = new (props: any) => any;
