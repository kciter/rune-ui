import { html as runeHtmlUtil, View, Html } from "rune-ts";
import { SsrAwareViewWrapper, isSSRContext } from "./ssr-context";

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

export function createSsrHtml(
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

    // SSR 컨텍스트에서만 SsrAwareViewWrapper 사용
    if (isSSRContext()) {
      return new SsrAwareViewWrapper(componentInstance);
    }

    // 일반 컨텍스트에서는 View 인스턴스를 반환 (타입 캐스팅)
    return componentInstance as unknown as Html;
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
