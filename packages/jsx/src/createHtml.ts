import { html } from "rune-ts";
import type { Html, View } from "rune-ts";

type Props = Record<string, unknown>;
type Child = string | View | Html | undefined | null | Child[];

function flatten(children: Child[]): unknown[] {
  const result: unknown[] = [];
  function flat(arr: Child[]) {
    for (const c of arr) {
      if (Array.isArray(c)) {
        flat(c);
      } else if (c !== null && c !== undefined) {
        result.push(c);
      }
    }
  }
  flat(children);
  return result;
}

export function createHtml(
  tag: string | (new (...args: any[]) => View<any>),
  props: Props = {},
  ...children: Child[]
): Html {
  const flat = flatten(children);

  if (typeof tag === "string") {
    // className을 class로 변환
    const normalizedProps = { ...props };
    if ("className" in normalizedProps) {
      normalizedProps.class = normalizedProps.className;
      delete normalizedProps.className;
    }

    const attrStr = Object.entries(normalizedProps)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");

    const start = [`<${tag}${attrStr ? " " + attrStr : ""}>`];
    const end = [`</${tag}>`];

    return html([...start, ...end] as any, flat);
  } else {
    // 커스텀 View인 경우 그냥 인스턴스 반환
    return new tag({ ...props, children }) as unknown as Html;
  }
}
