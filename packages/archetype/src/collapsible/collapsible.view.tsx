import { on, View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";
import { RuneElement, RuneChildren } from "@rune-ui/types";
import { collapsibleParts } from "./collapsible.anatomy";
import {
  CollapsibleStateView,
  CollapsibleStateViewProps,
} from "./collapsible.state";

// Root 컴포넌트
export interface RuneUICollapsibleRootProps
  extends CollapsibleStateViewProps,
    RuneElement<"div"> {
  /**
   * 컴포넌트 자식 요소
   */
  children?: RuneChildren;
}

export class CollapsibleRoot extends CollapsibleStateView<RuneUICollapsibleRootProps> {
  override onMount() {
    super.onMount();

    // 초기 상태 설정은 부모 클래스의 setupMachineSubscription에서 처리됨
  }

  override template() {
    const { expanded, onExpandedChange, disabled, children, ...rest } =
      this.data;

    return (
      <div {...rest} {...collapsibleParts.root.attrs}>
        {children}
      </div>
    );
  }
}

// CollapsiblePart - 공통 기능을 가진 뷰 컴포넌트
class CollapsiblePart<T extends object = {}> extends View<T> {
  protected root: CollapsibleRoot | null = null;

  protected onMount(): void {
    // Root 컴포넌트 찾기
    this.root = this.findRoot();
    if (!this.root) {
      console.warn(
        `${this.constructor.name} component must be used within a CollapsibleRoot.`,
      );
    }
  }

  protected findRoot() {
    let root = this.parentView;
    while (root && !(root instanceof CollapsibleRoot)) {
      root = root.parentView;
    }

    return root as CollapsibleRoot | null;
  }
}

// Trigger 컴포넌트
export interface RuneUICollapsibleTriggerProps extends RuneElement<"button"> {
  children?: RuneChildren;
}

export class CollapsibleTrigger extends CollapsiblePart<RuneUICollapsibleTriggerProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <button
        {...rest}
        {...collapsibleParts.trigger.attrs}
        aria-expanded={this.root?.isExpanded() ?? false}
        disabled={this.root?.isDisabled() ?? false}
      >
        {children}
      </button>
    );
  }

  @on("click")
  click() {
    this.root?.toggle();
  }
}

// Indicator 컴포넌트
export interface RuneUICollapsibleIndicatorProps extends RuneElement<"span"> {
  /**
   * 사용자 정의 아이콘
   */
  icon?: RuneChildren;
}

export class CollapsibleIndicator extends CollapsiblePart<RuneUICollapsibleIndicatorProps> {
  override template() {
    const { icon, ...rest } = this.data;
    const content = icon || "▼";

    return (
      <span {...rest} {...collapsibleParts.indicator.attrs}>
        {content}
      </span>
    );
  }
}

// Content 컴포넌트
export interface RuneUICollapsibleContentProps extends RuneElement<"div"> {
  children?: RuneChildren;
}

export class CollapsibleContent extends CollapsiblePart<RuneUICollapsibleContentProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <div
        {...rest}
        {...collapsibleParts.content.attrs}
        role="region"
        aria-hidden={this.root?.isExpanded() === false}
      >
        {children}
      </div>
    );
  }

  override onRender(): void {
    this.updateVisibility();
  }

  private updateVisibility() {
    if (!this.root) return;

    const element = this.element();
    if (!element) return;

    const isExpanded = this.root.isExpanded();
    element.setAttribute("aria-hidden", isExpanded ? "false" : "true");
  }
}

// Collapsible 네임스페이스로 내보내기
export const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Indicator: CollapsibleIndicator,
  Content: CollapsibleContent,
};
