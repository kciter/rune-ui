import { MachineView } from "../machine-view";
import {
  ToggleContext,
  ToggleEvent,
  createToggleMachine,
} from "./toggle.machine";
import { RuneElement, RuneChildren } from "@rune-ui/types";

/**
 * Toggle 루트 컴포넌트 속성
 */
export interface ToggleStateViewProps extends RuneElement<"div"> {
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

/**
 * Toggle 상태 관리 클래스
 */
export class ToggleStateView<
  T extends ToggleStateViewProps = ToggleStateViewProps,
> extends MachineView<T, ToggleContext, ToggleEvent> {
  constructor(props: T) {
    const machine = createToggleMachine({
      checked: props.checked,
      disabled: props.disabled,
    });
    super(props, machine);
  }

  override onMount() {
    const { onCheckedChange, disabled } = this.data;

    // 상태 변경 구독 설정
    this.setupMachineSubscription((state) => {
      if (state.changed) {
        // DOM 속성 업데이트
        this.updateDOMAttributes(state.value, {
          checked: state.context.checked,
          disabled: state.context.disabled,
        });

        // 콜백 호출
        if (onCheckedChange) {
          onCheckedChange(state.context.checked);
        }
      }
    });

    // // 비활성화 상태 변경 감지
    // if (disabled !== undefined && disabled !== this.getContext().disabled) {
    //   this.sendEvent(disabled ? "DISABLE" : "ENABLE");
    // }
  }

  /**
   * 토글 상태를 전환
   */
  toggle(): void {
    if (!this.data.disabled) {
      this.sendEvent("TOGGLE");
    }
  }

  /**
   * 토글을 켬 상태로 설정
   */
  check(): void {
    if (!this.data.disabled) {
      this.sendEvent("CHECK");
    }
  }

  /**
   * 토글을 끔 상태로 설정
   */
  uncheck(): void {
    if (!this.data.disabled) {
      this.sendEvent("UNCHECK");
    }
  }

  /**
   * 현재 토글 상태 반환
   */
  isChecked(): boolean {
    return this.getContext().checked;
  }

  /**
   * 비활성화 여부 반환
   */
  isDisabled(): boolean {
    return this.getContext().disabled;
  }
}
