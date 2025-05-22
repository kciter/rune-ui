import { BoxView } from "../Box";
import { RuneChildren, RuneElement } from "@/types";
import { createHtml } from "@rune-ui/jsx";
import { View } from "rune-ts";

export type RuneUIButtonProps = RuneElement<"button"> & {
  children?: RuneChildren;
};

export class ButtonView extends View<RuneUIButtonProps> {
  override template() {
    const { children, ...rest } = this.data;

    return <button {...rest}>{children}</button>;
  }
}
