import { RuneChildren, RuneElement, RuneView } from "@/types";
import { createHtml } from "@rune-ui/jsx";
import { html, View } from "rune-ts";
import { buttonParts } from "./button.anatomy";

export interface RuneUIButtonRootProps extends RuneElement<"button"> {
  children?: RuneChildren;
}

export class ButtonRoot extends View<RuneUIButtonRootProps> {
  override template() {
    const { children, ...rest } = this.data;
    return (
      <button {...rest} {...buttonParts.root.attrs}>
        {children}
      </button>
    );
  }
}

export interface RuneUIButtonInnerProps extends RuneElement<"span"> {
  children?: RuneChildren;
}

export class ButtonInner extends View<RuneUIButtonInnerProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <span {...rest} {...buttonParts.inner.attrs}>
        {children}
      </span>
    );
  }
}

export interface RuneUIButtonLeftIconProps extends RuneElement<"span"> {
  icon: RuneView;
}

export class ButtonLeftIcon extends View<RuneUIButtonLeftIconProps> {
  override template() {
    const { icon, ...rest } = this.data;
    return (
      <span {...rest} {...buttonParts.leftIcon.attrs}>
        {icon}
      </span>
    );
  }
}

export interface RuneUIButtonLabelProps extends RuneElement<"span"> {
  children?: RuneChildren;
}

export class ButtonLabel extends View<RuneUIButtonLabelProps> {
  override template() {
    const { children, ...rest } = this.data;
    return (
      <span {...rest} {...buttonParts.label.attrs}>
        {children}
      </span>
    );
  }
}

export interface RuneUIButtonRightIconProps extends RuneElement<"span"> {
  icon: RuneView;
}

export class ButtonRightIcon extends View<RuneUIButtonRightIconProps> {
  override template() {
    const { icon, ...rest } = this.data;
    return (
      <span {...rest} {...buttonParts.rightIcon.attrs}>
        {icon}
      </span>
    );
  }
}

export const Button = {
  Root: ButtonRoot,
  Inner: ButtonInner,
  LeftIcon: ButtonLeftIcon,
  Label: ButtonLabel,
  RightIcon: ButtonRightIcon,
};
