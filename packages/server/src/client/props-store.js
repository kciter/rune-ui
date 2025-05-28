// 컴포넌트 props를 중앙에서 관리하는 저장소

class PropsStore {
  constructor() {
    this.store = new Map();
    this.componentCounter = 0;
  }

  // 컴포넌트 ID를 생성하고 props를 저장
  register(componentName, props) {
    const componentId = `${componentName}_${++this.componentCounter}`;
    this.store.set(componentId, {
      componentName,
      props,
      timestamp: Date.now(),
    });
    return componentId;
  }

  // 컴포넌트 ID로 props 조회
  get(componentId) {
    return this.store.get(componentId);
  }

  // 특정 컴포넌트 이름의 모든 props 조회
  getByComponentName(componentName) {
    const results = [];
    for (const [id, data] of this.store.entries()) {
      if (data.componentName === componentName) {
        results.push({ id, ...data });
      }
    }
    return results;
  }

  // props 제거
  remove(componentId) {
    return this.store.delete(componentId);
  }

  // 모든 props를 JSON으로 직렬화
  serialize() {
    const serialized = {};
    for (const [id, data] of this.store.entries()) {
      serialized[id] = data;
    }
    return serialized;
  }

  // 직렬화된 데이터로부터 복원
  deserialize(serializedData) {
    this.store.clear();
    this.componentCounter = 0;

    for (const [id, data] of Object.entries(serializedData)) {
      this.store.set(id, data);
      // counter 업데이트
      const match = id.match(/_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > this.componentCounter) {
          this.componentCounter = num;
        }
      }
    }
  }

  // 모든 데이터 초기화
  clear() {
    this.store.clear();
    this.componentCounter = 0;
  }

  // DOM에서 JSON 스크립트 태그를 읽어서 데이터를 로드
  loadFromDOM() {
    if (typeof document === "undefined") return;

    // __RUNE_DATA__ 스크립트 태그에서 컴포넌트 데이터 로드
    const runeDataScripts = document.querySelectorAll("script.__RUNE_DATA__");
    runeDataScripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        if (data && data.name) {
          // 컴포넌트 ID 찾기 - 연관된 element의 data-rune-id 사용
          const componentName = data.name;
          let componentId = null;

          // 같은 클래스를 가진 element 찾기
          const elements = document.querySelectorAll(
            `[data-rune="${componentName}"]`,
          );
          elements.forEach((element) => {
            const id = element.getAttribute("data-rune-id");
            if (id) {
              componentId = id;
              this.store.set(componentId, {
                componentName: componentName,
                props: data,
                timestamp: Date.now(),
              });
              console.log(
                `📦 PropsStore: Loaded data for ${componentName} (${componentId}):`,
                data,
              );
            }
          });
        }
      } catch (e) {
        console.warn("📦 PropsStore: Failed to parse script data:", e);
      }
    });
  }
}

// 전역 인스턴스
if (typeof window !== "undefined") {
  if (!window.__RUNE_PROPS_STORE__) {
    window.__RUNE_PROPS_STORE__ = new PropsStore();

    // DOM이 로드되면 자동으로 데이터 로드
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        window.__RUNE_PROPS_STORE__.loadFromDOM();
      });
    } else {
      window.__RUNE_PROPS_STORE__.loadFromDOM();
    }
  }
}

export { PropsStore };
