import type { Html } from "rune-ts";
import { RuneChildren, RuneCSSProperties } from "@rune-ui/types";

declare global {
  export namespace JSX {
    type Element = Html;

    type JSXChildren = RuneChildren;

    type ElementProps<T extends keyof HTMLElementTagNameMap> = Omit<
      Partial<HTMLElementTagNameMap[T]>,
      "style" | "children"
    > & {
      children?: JSXChildren;
      style?: string | RuneCSSProperties;
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
