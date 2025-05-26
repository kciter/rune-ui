import { on, View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";
import { RuneElement, RuneChildren, RuneView } from "@rune-ui/types";
import { collapsibleParts } from "./collapsible.anatomy";
import { CollapsibleContext } from "./collapsible.machine";
import { CollapsibleStateView } from "./collapsible.state";

// Root 컴포넌트
export interface RuneUICollapsibleRootProps extends RuneElement<"div"> {
  /**
   * 펼침 상태
   */
  expanded?: boolean;

  /**
   * 펼침 상태가 변경될 때 호출되는 콜백
   */
  onExpandedChange?: (expanded: boolean) => void;

  /**
   * 비활성화 여부
   */
  disabled?: boolean;

  /**
   * 컴포넌트 자식 요소
   */
  children?: RuneChildren;
}

export class CollapsibleRoot extends CollapsibleStateView<RuneUICollapsibleRootProps> {
  private unsubscribe: (() => void) | null = null;

  override onMount() {
    // 상태 변경 구독
    this.unsubscribe = this.machine.subscribe((state) => {
      // DOM 속성 업데이트
      this.updateDOM(state.context);

      // 콜백 호출
      if (this.data.onExpandedChange) {
        this.data.onExpandedChange(state.context.expanded);
      }
    });
  }

  override onUnmount() {
    // 구독 해제 및 리소스 정리
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  override template() {
    return (
      <div {...this.data} {...collapsibleParts.root.attrs}>
        {this.data.children}
      </div>
    );
  }

  private updateDOM(state: CollapsibleContext) {
    const element = this.element();
    if (element) {
      element.setAttribute(
        "data-state",
        state.expanded ? "expanded" : "collapsed",
      );
      element.setAttribute("data-disabled", state.disabled ? "true" : "false");
    }
  }
}

// Trigger 컴포넌트
export interface RuneUICollapsibleTriggerProps extends RuneElement<"button"> {
  children?: RuneChildren;
}

export class CollapsibleTrigger extends View<RuneUICollapsibleTriggerProps> {
  private root: CollapsibleRoot | null = null;

  override onMount() {
    // Root 찾기
    this.root = this.findRoot();
    if (!this.root) {
      console.warn("CollapsibleTrigger must be used within a CollapsibleRoot.");
      return;
    }
  }

  override template() {
    const { children, ...rest } = this.data;

    return (
      <button {...rest} {...collapsibleParts.trigger.attrs}>
        {children}
      </button>
    );
  }

  private findRoot() {
    let root = this.parentView;
    while (root && !(root instanceof CollapsibleRoot)) {
      root = root.parentView;
    }

    return root as CollapsibleRoot | null;
  }

  @on("click")
  click() {
    this.root?.toggle();
  }
}

// Indicator 컴포넌트
export interface RuneUICollapsibleIndicatorProps extends RuneElement<"span"> {
  /**
   * 화살표 아이콘 (기본: ▼)
   */
  icon?: RuneView | string;
}

export class CollapsibleIndicator extends View<RuneUICollapsibleIndicatorProps> {
  private root: CollapsibleRoot | null = null;

  override onMount() {
    // Root 찾기
    this.root = this.findRoot();
    if (!this.root) {
      console.warn(
        "CollapsibleIndicator must be used within a CollapsibleRoot.",
      );
      return;
    }
  }

  override template() {
    const { icon, ...rest } = this.data;
    const content = icon || "▼";

    return (
      <span {...rest} {...collapsibleParts.indicator.attrs}>
        {content}
      </span>
    );
  }

  private findRoot() {
    let root = this.parentView;
    while (root && !(root instanceof CollapsibleRoot)) {
      root = root.parentView;
    }

    return root as CollapsibleRoot | null;
  }

  @on("click")
  click() {
    this.root?.expand();
  }
}

// Content 컴포넌트
export interface RuneUICollapsibleContentProps extends RuneElement<"div"> {
  children?: RuneChildren;
}

export class CollapsibleContent extends View<RuneUICollapsibleContentProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <div {...rest} {...collapsibleParts.content.attrs}>
        {children}
      </div>
    );
  }
}

// Collapsible 네임스페이스로 내보내기
export const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Indicator: CollapsibleIndicator,
  Content: CollapsibleContent,
};
