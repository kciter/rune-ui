import { View } from "rune-ts";
import type { As, RuneElement } from "@/types";
import { createHtml } from "@rune-ui/jsx";

export type RuneUIBoxProps<T extends As> = RuneElement<T> & {
  as?: T;
  children?: View[] | string;
};

export class BoxView<T extends As> extends View<RuneUIBoxProps<T>> {
  override template() {
    const {
      as: Tag = "div",
      children,
      ...rest
    } = this.data as RuneUIBoxProps<T> & {
      as: keyof HTMLElementTagNameMap;
    };

    return <Tag {...rest}>{children}</Tag>;
  }
}
