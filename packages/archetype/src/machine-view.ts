import { View } from "rune-ts";
import { RuneMachine, Context, EventName } from "@rune-ui/machine";

/**
 * 상태 머신을 통합한 기본 뷰 클래스
 */
export class MachineView<
  TProps extends object = {},
  TContext extends Context = {},
  TEvent extends { type: EventName } = { type: EventName },
> extends View<TProps> {
  /**
   * 상태 머신 인스턴스
   */
  protected machine: RuneMachine<TContext, TEvent>;

  /**
   * 머신 구독 해제 함수
   */
  protected unsubscribe: (() => void) | null = null;

  /**
   * 생성자
   * @param props 컴포넌트 속성
   * @param machine 상태 머신 인스턴스
   */
  constructor(props: TProps, machine: RuneMachine<TContext, TEvent>) {
    super(props);
    this.machine = machine;
  }

  /**
   * 컴포넌트 마운트 시 상태 머신 구독 설정
   */
  protected setupMachineSubscription(
    handler: (state: {
      context: TContext;
      value: string;
      changed: boolean;
    }) => void,
  ): void {
    this.unsubscribe = this.machine.subscribe(handler);
  }

  /**
   * DOM 요소에 상태 관련 속성 업데이트
   * @param stateValue 현재 상태 값
   * @param additionalAttributes 추가 속성 맵
   */
  protected updateDOMAttributes(
    stateValue: string,
    additionalAttributes: Record<string, any> = {},
  ): void {
    const element = this.element();
    if (!element) return;

    // 기본 상태 값 설정
    element.setAttribute("data-state", stateValue);

    // 추가 속성 설정
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      if (value === true) {
        element.setAttribute(`data-${key}`, "true");
      } else if (value === false) {
        element.setAttribute(`data-${key}`, "false");
      } else if (value !== undefined && value !== null) {
        element.setAttribute(`data-${key}`, String(value));
      }
    });
  }

  /**
   * 상태 머신에 이벤트 전송
   * @param event 이벤트 객체 또는 이벤트 타입 문자열
   */
  protected sendEvent(event: TEvent | string): void {
    this.machine.send(event);
  }

  /**
   * 컴포넌트 언마운트 시 상태 머신 구독 해제
   */
  override onUnmount(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * 현재 상태 컨텍스트 가져오기
   */
  protected getContext(): TContext {
    return this.machine.state.context;
  }

  /**
   * 현재 상태 값 가져오기
   */
  protected getState(): string {
    return this.machine.state.value;
  }
}
