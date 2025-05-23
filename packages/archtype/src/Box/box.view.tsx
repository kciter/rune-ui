import { View } from "rune-ts";
import type { As, RuneElement } from "@rune-ui/types";
import { createHtml } from "@rune-ui/jsx";

export type RuneUIBoxProps<T extends As> = RuneElement<T> & {
  as?: T;
  children?: View[] | string;
};

export class Box<T extends As = "div"> extends View<RuneUIBoxProps<T>> {
  override template() {
    const { as, children, ...rest } = this.data as RuneUIBoxProps<T> & {
      as: keyof HTMLElementTagNameMap;
    };

    const Tag = (as || "div") as keyof JSX.IntrinsicElements;
    return <Tag {...rest}>{children}</Tag>;
  }
}
