import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";
import { RuneElement, RuneChildren } from "@rune-ui/types";
import { toggleParts } from "./toggle.anatomy";
import { createToggleMachine } from "./toggle.machine";

// Root 컴포넌트
export interface RuneUIToggleRootProps extends RuneElement<"div"> {
  /**
   * 토글의 상태
   */
  checked?: boolean;

  /**
   * 토글 상태가 변경될 때 호출되는 콜백
   */
  onCheckedChange?: (checked: boolean) => void;

  /**
   * 토글 비활성화 여부
   */
  disabled?: boolean;

  /**
   * 컴포넌트 자식 요소
   */
  children?: RuneChildren;
}

export class ToggleRoot extends View<RuneUIToggleRootProps> {
  private machine;

  constructor(props: RuneUIToggleRootProps) {
    super(props);

    this.machine = createToggleMachine({
      checked: props.checked,
      disabled: props.disabled,
    });
  }

  override onMount() {
    const { onCheckedChange, disabled } = this.data;

    // 상태 변경 시 콜백 호출
    if (onCheckedChange) {
      this.machine.subscribe((state) => {
        if (state.changed) {
          onCheckedChange(state.context.checked);
        }
      });
    }

    // 비활성화 상태 변경 감지
    if (
      disabled !== undefined &&
      disabled !== this.machine.state.context.disabled
    ) {
      this.machine.send(disabled ? "DISABLE" : "ENABLE");
    }
  }

  override template() {
    const { children, ...rest } = this.data;
    const { checked, disabled } = this.machine.state.context;

    return (
      <div
        {...rest}
        {...toggleParts.root.attrs}
        data-state={checked ? "checked" : "unchecked"}
        data-disabled={disabled ? "true" : "false"}
      >
        {children}
      </div>
    );
  }

  override onRender() {
    this.addEventListener("click", () => this.toggle());
  }

  toggle() {
    if (!this.data.disabled) {
      this.machine.send("TOGGLE");
      this.element()?.setAttribute(
        "data-state",
        this.machine.state.context.checked ? "checked" : "unchecked",
      );
      this.element()?.setAttribute(
        "data-disabled",
        this.machine.state.context.disabled ? "true" : "false",
      );
    }
  }
}

// Track 컴포넌트
export interface RuneUIToggleTrackProps extends RuneElement<"div"> {
  children?: RuneChildren;
}

export class ToggleTrack extends View<RuneUIToggleTrackProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <div {...rest} {...toggleParts.track.attrs}>
        {children}
      </div>
    );
  }
}

// Thumb 컴포넌트
export interface RuneUIToggleThumbProps extends RuneElement<"div"> {
  children?: RuneChildren;
}

export class ToggleThumb extends View<RuneUIToggleThumbProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <div {...rest} {...toggleParts.thumb.attrs}>
        {children}
      </div>
    );
  }
}

// Label 컴포넌트
export interface RuneUIToggleLabelProps extends RuneElement<"label"> {
  children?: RuneChildren;
}

export class ToggleLabel extends View<RuneUIToggleLabelProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <label {...rest} {...toggleParts.label.attrs}>
        {children}
      </label>
    );
  }
}

// Toggle 네임스페이스로 내보내기
export const Toggle = {
  Root: ToggleRoot,
  Track: ToggleTrack,
  Thumb: ToggleThumb,
  Label: ToggleLabel,
};
