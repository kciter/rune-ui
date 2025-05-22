import { html, View } from "rune-ts";
import type { Html } from "rune-ts";

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
      } else if (c !== null && c !== undefined && c !== false) {
        result.push(c);
      }
    }
  }
  flat(children ?? []);
  // falsy 값(undefined, null, false, "")은 아예 제외
  return result.filter(
    (v) => v !== undefined && v !== null && v !== false && v !== ""
  );
}

export function createHtml(
  tag: string | (new (...args: any[]) => View<any>),
  props: Props = {},
  ...children: Child[]
): Html {
  if (typeof tag !== "string") {
    return new tag({ ...props }) as unknown as Html;
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
      if (typeof v === "function" || v instanceof View || Array.isArray(v)) {
        return "";
      }
      if (isPlainObject(v)) {
        return objectToAttrString(v);
      }
      return `${k}="${escapeAttr(String(v))}"`;
    })
    .filter(Boolean)
    .join(" ");

  const flat = flatten(children);

  if (flat.length === 0) {
    return html([`<${tag}${attrStr ? " " + attrStr : ""}></${tag}>`] as any);
  }
  if (flat.length === 1) {
    return html(
      [`<${tag}${attrStr ? " " + attrStr : ""}>`, `</${tag}>`] as any,
      flat[0]
    );
  }
  // 여러 children이 있을 때 템플릿 리터럴을 동적으로 생성
  const templateStrs = [
    `<${tag}${attrStr ? " " + attrStr : ""}>`,
    ...Array(flat.length).fill(""),
    `</${tag}>`,
  ].slice(0, flat.length + 1) as unknown as TemplateStringsArray;

  return html(templateStrs, ...flat);
}
