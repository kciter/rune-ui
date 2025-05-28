// RuneHydrator 구현 (간소화 버전)
class RuneHydrator {
  constructor() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.hydrate());
    } else {
      this.hydrate();
    }
  }

  hydrate() {
    console.log("💧 RuneHydrator: Starting hydration...");

    // 첫 번째: RunePage 하이드레이션 (페이지 전체)
    this.hydrateRunePage();

    // 두 번째: 일반 컴포넌트 하이드레이션
    this.hydrateComponents();
  }

  hydrateRunePage() {
    // RunePage는 #__rune_root__ 요소에서 하이드레이션
    const rootElement = document.querySelector("#__rune_root__");
    if (!rootElement) {
      console.warn(
        "💧 RuneHydrator: #__rune_root__ element not found for RunePage hydration",
      );
      return;
    }

    // 윈도우에서 페이지 클래스 찾기 (HomePage, UserPage 등)
    const pageClasses = Object.keys(window).filter(
      (key) =>
        key.endsWith("Page") &&
        typeof window[key] === "function" &&
        window[key].prototype &&
        typeof window[key].prototype.template === "function",
    );

    if (pageClasses.length > 0) {
      const pageClassName = pageClasses[0]; // 첫 번째 페이지 클래스 사용
      const PageClass = window[pageClassName];

      try {
        // 페이지 props 가져오기
        const pageProps = window.__RUNE_DATA__ || {};
        const pageInstance = new PageClass(pageProps);

        if (typeof pageInstance.hydrateFromSSR === "function") {
          pageInstance.hydrateFromSSR(rootElement);
          console.log(
            `💧 RuneHydrator: ${pageClassName} hydrated successfully`,
          );

          // RunePage 하이드레이션 후, 그 안의 모든 rune 컴포넌트들을 하이드레이션 완료로 표시
          const childElements = rootElement.querySelectorAll("[data-rune]");
          childElements.forEach((element) => {
            // RunePage 내부의 컴포넌트들도 개별적으로 하이드레이션이 필요할 수 있으므로
            // 완료 표시를 하지 않음
            console.log(
              `💧 RuneHydrator: Found ${element.getAttribute("data-rune")} inside RunePage, will hydrate individually`,
            );
          });
        } else {
          console.warn(
            `💧 RuneHydrator: ${pageClassName} does not have hydrateFromSSR method`,
          );
        }
      } catch (error) {
        console.error(
          `💧 RuneHydrator: Error hydrating ${pageClassName}:`,
          error,
        );
      }
    } else {
      console.warn("💧 RuneHydrator: No RunePage class found in window object");
    }
  }

  hydrateComponents() {
    const runeElements = document.querySelectorAll("[data-rune]");

    runeElements.forEach((element) => {
      const componentName = element.getAttribute("data-rune");
      const componentId = element.getAttribute("data-rune-id");

      // 이미 하이드레이션된 요소는 건너뛰기
      if (element.__rune_hydrated) {
        console.log(
          `💧 RuneHydrator: ${componentName} already hydrated, skipping`,
        );
        return;
      }

      let props = {};

      // Props Store를 우선으로 사용, 없으면 DOM 속성 fallback
      if (componentId && window.__RUNE_PROPS_STORE__) {
        const storeData = window.__RUNE_PROPS_STORE__.get(componentId);
        if (storeData) {
          props = storeData.props;
        }
      }

      // Props Store에서 찾지 못한 경우 기존 DOM 속성 방식 사용
      if (Object.keys(props).length === 0) {
        const propsString = element.getAttribute("data-rune-props");
        if (propsString) {
          try {
            props = JSON.parse(propsString);
          } catch (e) {
            console.error(
              "💧 RuneHydrator: Failed to parse props for",
              componentName,
              propsString,
              e,
            );
          }
        }
      }

      if (componentName) {
        const ComponentClass = window[componentName];

        if (ComponentClass && typeof ComponentClass === "function") {
          if (typeof ComponentClass.prototype.hydrateFromSSR === "function") {
            try {
              const instance = new ComponentClass(props);
              instance.hydrateFromSSR(element);
              // 하이드레이션 완료 표시
              element.__rune_hydrated = true;
              console.log(
                `💧 RuneHydrator: ${componentName} hydrated successfully`,
              );
            } catch (e) {
              console.error(
                `💧 RuneHydrator: Error hydrating component "${componentName}"`,
                e,
                { element, props },
              );
            }
          } else {
            if (typeof ComponentClass.createAndHydrate === "function") {
              console.warn(
                `💧 RuneHydrator: Component "${componentName}" does not have hydrateFromSSR, attempting createAndHydrate (legacy).`,
              );
              ComponentClass.createAndHydrate(element, props);
              element.__rune_hydrated = true;
            } else {
              console.error(
                `💧 RuneHydrator: Component class "${componentName}" found on window object, but it lacks a hydrateFromSSR method and createAndHydrate static method.`,
              );
            }
          }
        } else {
          console.error(
            `💧 RuneHydrator: Component class "${componentName}" not found on window object or is not a constructor.`,
          );
        }
      } else {
        console.warn(
          "💧 RuneHydrator: Element is missing data-rune attribute.",
          element,
        );
      }
    });
  }
}

// Ensure it's available for instantiation in __rune_client__.js
if (typeof window !== "undefined") {
  window.RuneHydrator = RuneHydrator;
}
