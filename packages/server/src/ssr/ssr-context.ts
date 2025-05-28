import { View } from "rune-ts";

let IS_SSR_CONTEXT = false;
let PROPS_STORE: Map<string, any> = new Map(); // 서버 사이드 props 저장소

export function setSsrContext(isSsr: boolean): void {
  IS_SSR_CONTEXT = isSsr;
  if (isSsr) {
    PROPS_STORE.clear(); // SSR 시작 시 props 저장소 초기화
  }
}

export function getPropsStore(): Map<string, any> {
  return PROPS_STORE;
}

export function isSSRContext(): boolean {
  return IS_SSR_CONTEXT;
}

export class SsrAwareViewWrapper extends View<any> {
  private originalInstance: View<any>;
  private componentId?: string;

  constructor(instance: View<any>) {
    super(instance.data, ...(instance as any)._args);
    this.originalInstance = instance;
  }

  override toHtml(_isSSRFromParentContext?: boolean): string {
    const htmlString = this.originalInstance.toHtml(IS_SSR_CONTEXT);

    if (IS_SSR_CONTEXT && this.originalInstance.data) {
      try {
        // children, parentView, subViewsFromTemplate, key 등은 rune-ts 내부적으로 관리되거나
        // props로 직렬화할 필요가 없는 속성들이므로 제외합니다.
        const {
          children,
          parentView,
          subViewsFromTemplate,
          key,
          _base_name,
          className,
          ...propsToSerialize
        } = this.originalInstance.data;

        if (Object.keys(propsToSerialize).length > 0) {
          // props를 중앙 저장소에 저장하고 고유 ID 생성
          const componentName = this.originalInstance.constructor.name;
          this.componentId = `${componentName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          PROPS_STORE.set(this.componentId, {
            componentName,
            props: propsToSerialize,
          });

          // HTML에는 data-rune-id만 추가
          return htmlString.replace(
            /^<([^ >]+)/,
            `<$1 data-rune-id='${this.componentId}' data-rune-view='${componentName}'`,
          );
        } else {
          // props가 없는 경우에도 컴포넌트 이름은 추가
          return htmlString.replace(
            /^<([^ >]+)/,
            `<$1 data-rune-view='${this.originalInstance.constructor.name}'`,
          );
        }
      } catch (error) {
        console.error(
          `[SsrAwareViewWrapper] Error processing props for ${this.originalInstance.constructor.name}:`,
          error,
        );
      }
    }
    return htmlString;
  }

  override toString(): string {
    return this.originalInstance.toString();
  }
}
