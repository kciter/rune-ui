import { RuneChildren, RuneElement, RuneView } from "@rune-ui/types";
import { createHtml } from "@rune-ui/jsx";
import { View } from "rune-ts";
import { buttonParts } from "./button.anatomy";

// Button 컴포넌트의 루트
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

// ButtonPart - 공통 기능을 가진 뷰 컴포넌트
class ButtonPart<T extends object = {}> extends View<T> {
  protected root: ButtonRoot | null = null;

  protected onMount(): void {
    // Root 컴포넌트 찾기
    this.root = this.findRoot();
    if (!this.root) {
      console.warn(
        `${this.constructor.name} component must be used within a ButtonRoot.`,
      );
    }
  }

  protected findRoot() {
    let root = this.parentView;
    while (root && !(root instanceof ButtonRoot)) {
      root = root.parentView;
    }

    return root as ButtonRoot | null;
  }
}

// Button 컴포넌트의 내부
export interface RuneUIButtonInnerProps extends RuneElement<"span"> {
  children?: RuneChildren;
}

export class ButtonInner extends ButtonPart<RuneUIButtonInnerProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <span {...rest} {...buttonParts.inner.attrs}>
        {children}
      </span>
    );
  }
}

// Button 컴포넌트의 왼쪽 아이콘
export interface RuneUIButtonLeftIconProps extends RuneElement<"span"> {
  icon: RuneView;
}

export class ButtonLeftIcon extends ButtonPart<RuneUIButtonLeftIconProps> {
  override template() {
    const { icon, ...rest } = this.data;
    return (
      <span {...rest} {...buttonParts.leftIcon.attrs}>
        {icon}
      </span>
    );
  }
}

// Button 컴포넌트의 레이블
export interface RuneUIButtonLabelProps extends RuneElement<"span"> {
  children?: RuneChildren;
}

export class ButtonLabel extends ButtonPart<RuneUIButtonLabelProps> {
  override template() {
    const { children, ...rest } = this.data;
    return (
      <span {...rest} {...buttonParts.label.attrs}>
        {children}
      </span>
    );
  }
}

// Button 컴포넌트의 오른쪽 아이콘
export interface RuneUIButtonRightIconProps extends RuneElement<"span"> {
  icon: RuneView;
}

export class ButtonRightIcon extends ButtonPart<RuneUIButtonRightIconProps> {
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
