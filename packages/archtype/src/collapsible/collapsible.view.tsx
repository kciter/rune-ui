import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";
import { RuneElement, RuneChildren, RuneView } from "@rune-ui/types";
import { collapsibleParts } from "./collapsible.anatomy";
import { createCollapsibleMachine } from "./collapsible.machine";

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

export class CollapsibleRoot extends View<RuneUICollapsibleRootProps> {
  private machine;

  constructor(props: RuneUICollapsibleRootProps) {
    super(props);

    this.machine = createCollapsibleMachine({
      expanded: props.expanded,
      disabled: props.disabled,
    });
  }

  override onMount() {
    const { onExpandedChange, disabled } = this.data;

    // 상태 변경 시 콜백 호출
    if (onExpandedChange) {
      this.machine.subscribe((state) => {
        if (state.changed) {
          onExpandedChange(state.context.expanded);
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
    const { expanded, disabled } = this.machine.state.context;

    return (
      <div
        {...rest}
        {...collapsibleParts.root.attrs}
        data-state={expanded ? "expanded" : "collapsed"}
        data-disabled={disabled ? "true" : "false"}
      >
        {children}
      </div>
    );
  }

  // API 메서드
  toggle() {
    this.machine.send("TOGGLE");
    this._updateStateAttributes();
  }

  expand() {
    this.machine.send("EXPAND");
    this._updateStateAttributes();
  }

  collapse() {
    this.machine.send("COLLAPSE");
    this._updateStateAttributes();
  }

  private _updateStateAttributes() {
    const { expanded, disabled } = this.machine.state.context;
    const element = this.element();
    if (element) {
      element.setAttribute("data-state", expanded ? "expanded" : "collapsed");
      element.setAttribute("data-disabled", disabled ? "true" : "false");
    }
    this.redraw();
  }
}

// Trigger 컴포넌트
export interface RuneUICollapsibleTriggerProps extends RuneElement<"button"> {
  children?: RuneChildren;
}

export class CollapsibleTrigger extends View<RuneUICollapsibleTriggerProps> {
  private root: CollapsibleRoot | null = null;

  override onMount() {
    // 부모 요소 중 CollapsibleRoot 찾기
    let parent = this.parentView;
    while (parent) {
      if (parent instanceof CollapsibleRoot) {
        this.root = parent;
        break;
      }
      parent = parent.parentView;
    }

    // 클릭 이벤트 핸들러 추가
    this.addEventListener("click", () => {
      if (this.root) {
        this.root.toggle();
      }
    });
  }

  override template() {
    const { children, ...rest } = this.data;

    return (
      <button {...rest} {...collapsibleParts.trigger.attrs} type="button">
        {children}
      </button>
    );
  }
}

// Indicator 컴포넌트
export interface RuneUICollapsibleIndicatorProps extends RuneElement<"span"> {
  /**
   * 화살표 아이콘 (기본: ▼)
   */
  icon?: RuneView | string;

  children?: RuneChildren;
}

export class CollapsibleIndicator extends View<RuneUICollapsibleIndicatorProps> {
  override template() {
    const { icon, children, ...rest } = this.data;
    const content = icon || children || "▼";

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

export class CollapsibleContent extends View<RuneUICollapsibleContentProps> {
  override template() {
    const { children, ...rest } = this.data;

    return (
      <div {...rest} {...collapsibleParts.content.attrs}>
        {children}
      </div>
    );
  }

  override onRender(): void {
    // 상위 요소의 상태에 따라 표시/숨김
    let parent = this.parentView;
    while (parent) {
      if (parent instanceof CollapsibleRoot) {
        const expanded =
          parent.element()?.getAttribute("data-state") === "expanded";
        const element = this.element();
        if (element) {
          element.style.display = expanded ? "" : "none";
        }
        break;
      }
      parent = parent.parentView;
    }
  }
}

// Collapsible 네임스페이스로 내보내기
export const Collapsible = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Indicator: CollapsibleIndicator,
  Content: CollapsibleContent,
};
