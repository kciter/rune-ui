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
    console.log("💧 RuneHydrator: Starting hydration process...");

    const runeElements = document.querySelectorAll("[data-rune]");
    console.log(
      `💧 RuneHydrator: Found ${runeElements.length} elements with [data-rune]`,
    );

    runeElements.forEach((element) => {
      const componentName = element.getAttribute("data-rune");
      const componentId = element.getAttribute("data-rune-id");

      let props = {};

      // Props Store를 우선으로 사용, 없으면 DOM 속성 fallback
      if (componentId && window.__RUNE_PROPS_STORE__) {
        const storeData = window.__RUNE_PROPS_STORE__.get(componentId);
        if (storeData) {
          props = storeData.props;
          console.log(
            `💧 RuneHydrator: Retrieved props from store for "${componentName}":`,
            props,
          );
        }
      }

      // Props Store에서 찾지 못한 경우 기존 DOM 속성 방식 사용
      if (Object.keys(props).length === 0) {
        const propsString = element.getAttribute("data-rune-props");
        if (propsString) {
          try {
            props = JSON.parse(propsString);
            console.log(
              `💧 RuneHydrator: Retrieved props from DOM attribute for "${componentName}":`,
              props,
            );
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

      console.log(
        `💧 RuneHydrator: Processing element <${element.tagName}> with data-rune="${componentName}"`,
        { element, props, componentId },
      );

      if (componentName) {
        const ComponentClass = window[componentName];

        if (ComponentClass && typeof ComponentClass === "function") {
          if (typeof ComponentClass.prototype.hydrateFromSSR === "function") {
            try {
              const instance = new ComponentClass(props);
              console.log(
                `💧 RuneHydrator: Attempting to hydrate "${componentName}" with props:`,
                props,
                `on element:`,
                element,
              );
              instance.hydrateFromSSR(element);
              console.log(
                `💧 RuneHydrator: Successfully called hydrateFromSSR for "${componentName}".`,
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
    console.log("💧 RuneHydrator: Hydration process completed.");
  }
}

// Ensure it's available for instantiation in __rune_client__.js
if (typeof window !== "undefined") {
  window.RuneHydrator = RuneHydrator;
}
