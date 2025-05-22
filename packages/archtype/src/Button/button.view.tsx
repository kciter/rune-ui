import { RuneChildren, RuneElement } from "@/types";
import { createHtml } from "@rune-ui/jsx";
import { View } from "rune-ts";
import { buttonParts } from "./button.anatomy";

export type RuneUIButtonProps = RuneElement<"button"> & {
  children?: RuneChildren;
  leftIconView?: View;
  rightIconView?: View;
  loading?: boolean;
  disabled?: boolean;
  spinnerView?: View;
  spinnerText?: string;
};

export class ButtonView extends View<RuneUIButtonProps> {
  override template() {
    const {
      children,
      leftIconView,
      rightIconView,
      loading,
      disabled,
      spinnerView,
      spinnerText,
      ...rest
    } = this.data;

    return (
      <button {...rest} disabled={disabled} {...buttonParts.root.attrs}>
        {loading && (
          <span {...buttonParts.spinner.attrs}>
            {spinnerView}
            {spinnerText && (
              <span {...buttonParts.spinnerText.attrs}>{spinnerText}</span>
            )}
          </span>
        )}
        {leftIconView && (
          <span {...buttonParts.leftIcon.attrs}>{leftIconView}</span>
        )}
        {!loading && <span {...buttonParts.label.attrs}>{children}</span>}
        {rightIconView && (
          <span {...buttonParts.rightIcon.attrs}>{rightIconView}</span>
        )}
      </button>
    );
  }
}
