import { createHtml } from "@rune-ui/jsx";
import { RuneElement, RuneChildren } from "@rune-ui/types";
import { toggleParts } from "./toggle.anatomy";
import { ToggleStateView, ToggleStateViewProps } from "./toggle.state";
import { on, View } from "rune-ts";

// Root 컴포넌트 - 상태 관리
export class ToggleRoot extends ToggleStateView {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <div
        {...rest}
        {...toggleParts.root.attrs}
        data-state={this.isChecked() ? "checked" : "unchecked"}
        data-disabled={this.isDisabled() ? "true" : "false"}
      >
        {children}
      </div>
    );
  }

  @on("click")
  handleClick() {
    if (!this.isDisabled()) {
      this.toggle();
    }
  }
}

// TogglePart - 공통 기능을 가진 뷰 컴포넌트
class TogglePart<T extends object = {}> extends View<T> {
  protected root: ToggleRoot | null = null;

  protected onMount(): void {
    // Root 컴포넌트 찾기
    this.root = this.findRoot();
    if (!this.root) {
      console.warn(
        `${this.constructor.name} component must be used within a ToggleRoot.`,
      );
    }
  }

  protected findRoot() {
    let root = this.parentView;
    while (root && !(root instanceof ToggleRoot)) {
      root = root.parentView;
    }

    return root as ToggleRoot | null;
  }
}

// Track 컴포넌트 - 배경 트랙
export interface RuneUIToggleTrackProps extends RuneElement<"div"> {
  children?: RuneChildren;
}

export class ToggleTrack extends TogglePart<RuneUIToggleTrackProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <div {...rest} {...toggleParts.track.attrs}>
        {children}
      </div>
    );
  }
}

// Thumb 컴포넌트 - 움직이는 동그라미
export interface RuneUIToggleThumbProps extends RuneElement<"div"> {
  children?: RuneChildren;
}

export class ToggleThumb extends TogglePart<RuneUIToggleThumbProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <div {...rest} {...toggleParts.thumb.attrs}>
        {children}
      </div>
    );
  }
}

// Label 컴포넌트 - 텍스트 레이블
export interface RuneUIToggleLabelProps extends RuneElement<"label"> {
  children?: RuneChildren;
}

export class ToggleLabel extends TogglePart<RuneUIToggleLabelProps> {
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
