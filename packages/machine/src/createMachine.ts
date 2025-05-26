import {
  StateMachineOptions,
  MachineState,
  Context,
  EventName,
  RuneMachine,
  Transition,
} from "./types";

export function createMachine<
  TContext extends Context,
  TEvent extends { type: EventName },
>(
  config: StateMachineOptions<TContext, TEvent>,
): RuneMachine<TContext, TEvent> {
  let currentState: MachineState<TContext> = {
    value: config.initial,
    context: { ...config.context },
    changed: false,
  };

  const listeners = new Set<(state: MachineState<TContext>) => void>();

  // 전이(transition)를 수행하는 함수
  function transition(
    state: MachineState<TContext>,
    event: TEvent,
  ): MachineState<TContext> {
    const stateConfig = config.states[state.value];

    if (!stateConfig || !stateConfig.on) {
      return { ...state, changed: false };
    }

    const eventType = event.type as keyof typeof stateConfig.on;
    const transitionConfig = stateConfig.on[eventType];

    if (!transitionConfig) {
      console.warn(
        `No transition defined for event "${eventType}" in state "${state.value}".`,
      );
      return { ...state, changed: false };
    }

    const transitions = Array.isArray(transitionConfig)
      ? (transitionConfig as Transition<TContext, TEvent>[])
      : ([transitionConfig] as Transition<TContext, TEvent>[]);

    // 가능한 전이 중 조건(cond)을 만족하는 첫 번째 전이를 찾음
    const validTransition = transitions.find(
      (t) => !t.cond || t.cond(state.context, event),
    );

    if (!validTransition) {
      console.warn(
        `No valid transition found for event "${event.type}" in state "${state.value}".`,
      );
      return { ...state, changed: false };
    }

    // 현재 상태의 exit 액션 실행
    stateConfig.exit?.forEach((action) => action(state.context, event));

    // 전이 액션 실행
    validTransition.actions?.forEach((action) => action(state.context, event));

    // 새로운 상태의 entry 액션 실행
    if (validTransition.target) {
      const targetState = config.states[validTransition.target];
      targetState?.entry?.forEach((action) => action(state.context, event));
    }

    return {
      value: validTransition.target ?? state.value,
      context: state.context,
      changed: true,
    };
  }

  // 상태가 변경될 때 모든 리스너에게 알림
  function notify() {
    listeners.forEach((listener) => listener(currentState));
  }

  const machine: RuneMachine<TContext, TEvent> = {
    id: config.id,

    get state() {
      return currentState;
    },

    send(event) {
      const eventObj =
        typeof event === "string" ? ({ type: event } as TEvent) : event;
      currentState = transition(currentState, eventObj);

      if (currentState.changed) {
        notify();
      }
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return machine;
}
