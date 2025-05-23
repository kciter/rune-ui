import type { Html } from "rune-ts";

declare global {
  export namespace JSX {
    type Element = Html;

    type JSXChildren =
      | string
      | number
      | boolean
      | null
      | undefined
      | View
      | Html
      | (string | number | boolean | null | undefined | View | Html)[];

    type ElementProps<T extends keyof HTMLElementTagNameMap> = Omit<
      Partial<HTMLElementTagNameMap[T]>,
      "style" | "children"
    > & {
      children?: JSXChildren;
      style?: string;
    };

    type IntrinsicElements = {
      [K in keyof HTMLElementTagNameMap]: ElementProps<K>;
    };

    interface ElementClass {
      data: any;
    }

    interface ElementAttributesProperty {
      data: {};
    }

    interface ElementChildrenAttribute {
      children: {};
    }
  }
}
