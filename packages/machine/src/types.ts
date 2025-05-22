import { View } from "rune-ts";

export type StateValue = string;
export type EventName = string;
export type Context = Record<string, any>;

export interface StateMachineOptions<
  TContext extends Context,
  TEvent extends { type: EventName }
> {
  id: string;
  initial: StateValue;
  context: TContext;
  states: {
    [key in StateValue]: State<TContext, TEvent>;
  };
}

export interface State<
  TContext extends Context,
  TEvent extends { type: EventName }
> {
  on?: {
    [K in TEvent["type"]]?:
      | Transition<TContext, TEvent>
      | Transition<TContext, TEvent>[];
  };
  entry?: Action<TContext, TEvent>[];
  exit?: Action<TContext, TEvent>[];
}

export type Transition<
  TContext extends Context,
  TEvent extends { type: EventName }
> = {
  target?: StateValue;
  actions?: Action<TContext, TEvent>[];
  cond?: Condition<TContext, TEvent>;
};

export type Action<
  TContext extends Context,
  TEvent extends { type: EventName }
> = (context: TContext, event: TEvent) => void;

export type Condition<
  TContext extends Context,
  TEvent extends { type: EventName }
> = (context: TContext, event: TEvent) => boolean;

export interface MachineState<TContext extends Context> {
  value: StateValue;
  context: TContext;
  changed: boolean;
}

export interface RuneMachine<
  TContext extends Context,
  TEvent extends { type: EventName }
> {
  id: string;
  state: MachineState<TContext>;
  send: (event: TEvent["type"] | TEvent) => void;
  subscribe: (listener: (state: MachineState<TContext>) => void) => () => void;
}
