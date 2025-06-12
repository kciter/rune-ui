import { html as runeHtmlUtil, View } from "rune-ts";
import type { Html } from "rune-ts";
import { styleObjectToString } from "./binding/style-attribute";

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

function isStyleObject(k: string) {
  return k === "style";
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

export function createHtml(
  tag: string | (new (...args: any[]) => View<any>),
  props: Props = {},
  ...children: Child[]
): Html | View<any> {
  if (typeof tag !== "string") {
    const mergedProps = {
      ...props,
      ...(children.length > 0
        ? { children: children.length === 1 ? children[0] : children }
        : {}),
    };
    return new tag(mergedProps);
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
      if (typeof v === "function" || v instanceof View) {
        return "";
      }
      if (Array.isArray(v)) {
        return "";
      }
      if (isPlainObject(v)) {
        return isStyleObject(k)
          ? `${k}="${escapeAttr(styleObjectToString(v))}"`
          : objectToAttrString(v);
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
