import { html as runeHtmlUtil, View } from "rune-ts";
import type { Html, VirtualView } from "rune-ts";

type Props = Record<string, unknown>;
type Child = string | boolean | View | Html | undefined | null | Child[];

function escapeAttr(val: string): string {
  return val.replace(/"/g, "&quot;");
}

function objectToAttrString(obj: Record<string, any>): string {
  return Object.entries(obj)
    .map(([k, v]) => {
      if (v === true) return k;
      if (v === false || v == null) return "";
      if (typeof v === "object") return ""; // 중첩 객체는 무시
      return `${k}="${escapeAttr(String(v))}"`;
    })
    .filter(Boolean)
    .join(" ");
}

function isPlainObject(val: unknown): val is Record<string, any> {
  return typeof val === "object" && val !== null && val.constructor === Object;
}

function flatten(children: Child[]): unknown[] {
  const result: unknown[] = [];
  function flat(arr: Child[]) {
    if (!Array.isArray(arr)) return;
    for (const c of arr) {
      if (Array.isArray(c)) {
        flat(c);
      } else if (c !== null && c !== undefined && c !== false && c !== "") {
        // 빈 문자열도 제외
        result.push(c);
      }
    }
  }
  flat(children ?? []);
  return result;
}

let IS_SSR_CONTEXT = false;
let PROPS_STORE: Map<string, any> = new Map(); // 서버 사이드 props 저장소

export function setSsrContextInJsx(isSsr: boolean): void {
  IS_SSR_CONTEXT = isSsr;
  if (isSsr) {
    PROPS_STORE.clear(); // SSR 시작 시 props 저장소 초기화
  }
}

export function getPropsStore(): Map<string, any> {
  return PROPS_STORE;
}

function escapeAttrValue(val: string): string {
  return val
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&apos;") // In HTML5, &apos; is valid for attributes.
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

class SsrAwareViewWrapper extends View<any> {
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

  // parentView, subViewsFromTemplate, _base_name, key에 대한 getter/setter를 제거합니다.
  // SsrAwareViewWrapper는 View를 상속하므로 이러한 속성들을 이미 가지고 있으며,
  // rune-ts 시스템이 이 wrapper 인스턴스를 View처럼 다룰 때 이 속성들에 직접 접근할 것입니다.
  // toHtml 외의 메서드(예: toString)는 필요에 따라 originalInstance로 위임할 수 있습니다.

  override toString(): string {
    return this.originalInstance.toString();
  }

  // 만약 rune-ts가 _base_name이나 key를 SsrAwareViewWrapper 인스턴스에서 직접 읽어야 하고,
  // originalInstance의 값을 사용해야 한다면, 다음과 같이 getter를 유지할 수 있습니다.
  // 하지만 이 경우에도 View 클래스의 실제 속성 정의와 충돌하지 않도록 주의해야 합니다.
  // 현재 View/_base_name, VirtualView/key는 직접 속성이므로 getter override는 문제를 일으킵니다.
  // 따라서 아래 getter들도 제거하는 것이 맞습니다.

  // protected get _base_name(): string {
  //   return (this.originalInstance as any)._base_name || "View";
  // }

  // get key(): string {
  //   return this.originalInstance.key;
  // }

  // Proxy other necessary methods/properties from originalInstance if needed
  // 예를 들어, rune-ts가 SsrAwareViewWrapper 인스턴스의 특정 메서드를 호출하고,
  // 그 행동이 originalInstance에 의해 결정되어야 한다면 해당 메서드를 여기서 프록시합니다.
  // 예:
  // override someMethod(...args: any[]): any {
  //   return (this.originalInstance as any).someMethod(...args);
  // }
}

export function createHtml(
  tag: string | (new (...args: any[]) => View<any>),
  props: Props = {},
  ...children: Child[]
): Html | SsrAwareViewWrapper {
  if (typeof tag !== "string") {
    const mergedProps = {
      ...props,
      ...(children.length > 0
        ? { children: children.length === 1 ? children[0] : children }
        : {}),
    };
    const componentInstance = new tag(mergedProps);
    return new SsrAwareViewWrapper(componentInstance);
  }

  const normalizedProps = { ...props };
  if ("className" in normalizedProps) {
    normalizedProps.class = normalizedProps.className;
    delete normalizedProps.className;
  }

  const attrStr = Object.entries(normalizedProps)
    .map(([k, v]) => {
      if (v === true) return k;
      if (v === false || v == null) return "";
      if (
        typeof v === "function" ||
        v instanceof View ||
        v instanceof SsrAwareViewWrapper
      ) {
        // SsrAwareViewWrapper 추가
        return "";
      }
      if (Array.isArray(v)) {
        return "";
      }
      if (isPlainObject(v)) {
        return objectToAttrString(v);
      }
      return `${k}="${escapeAttr(String(v))}"`;
    })
    .filter(Boolean)
    .join(" ");

  const flatChildren = flatten(children);

  if (flatChildren.length === 0) {
    return runeHtmlUtil([
      `<${tag}${attrStr ? " " + attrStr : ""}></${tag}>`,
    ] as any);
  }

  const templateStrings = [`<${tag}${attrStr ? " " + attrStr : ""}>`];
  for (let i = 0; i < flatChildren.length - 1; i++) {
    templateStrings.push("");
  }
  templateStrings.push(`</${tag}>`);

  return runeHtmlUtil(
    templateStrings as any as TemplateStringsArray,
    ...flatChildren,
  );
}
