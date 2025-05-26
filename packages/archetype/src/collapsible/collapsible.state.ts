import {
  CollapsibleContext,
  CollapsibleEvent,
  createCollapsibleMachine,
} from "./collapsible.machine";
import { MachineView } from "../machine-view";

export interface CollapsibleStateViewProps {
  /**
   * 콘텐츠의 확장 상태
   */
  expanded?: boolean;

  /**
   * 비활성화 상태
   */
  disabled?: boolean;

  /**
   * 펼침 상태가 변경될 때 호출되는 콜백
   */
  onExpandedChange?: (expanded: boolean) => void;
}

export class CollapsibleStateView<
  T extends CollapsibleStateViewProps = CollapsibleStateViewProps,
> extends MachineView<T, CollapsibleContext, CollapsibleEvent> {
  constructor(props: T) {
    const machine = createCollapsibleMachine({
      expanded: props.expanded ?? false,
      disabled: props.disabled ?? false,
    });

    super(props, machine);
  }

  override onMount() {
    // 상태 변경 구독 설정
    this.setupMachineSubscription((state) => {
      // 상태 값과 컨텍스트 정보로 DOM 속성 업데이트
      this.updateDOMAttributes(state.value, {
        expanded: state.context.expanded,
        disabled: state.context.disabled,
      });

      // 확장 상태 변경 콜백 실행
      if (this.data.onExpandedChange && state.changed) {
        this.data.onExpandedChange(state.context.expanded);
      }
    });

    // 초기 상태로 DOM 속성 설정
    this.updateDOMAttributes(this.getState(), {
      expanded: this.getContext().expanded,
      disabled: this.getContext().disabled,
    });
  }

  /**
   * 토글 - 펼침/접힘 상태 전환
   */
  toggle() {
    this.sendEvent("TOGGLE");
  }

  /**
   * 펼치기
   */
  expand() {
    this.sendEvent("EXPAND");
  }

  /**
   * 접기
   */
  collapse() {
    this.sendEvent("COLLAPSE");
  }

  /**
   * 비활성화
   */
  disable() {
    this.sendEvent("DISABLE");
  }

  /**
   * 활성화
   */
  enable() {
    this.sendEvent("ENABLE");
  }

  /**
   * 현재 펼침 상태 확인
   */
  isExpanded(): boolean {
    return this.getContext().expanded;
  }

  /**
   * 현재 비활성화 상태 확인
   */
  isDisabled(): boolean {
    return this.getContext().disabled;
  }
}
