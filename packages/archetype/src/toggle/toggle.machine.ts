import { createMachine, assign } from "@rune-ui/machine";

export interface ToggleContext {
  checked: boolean;
  disabled: boolean;
}

export type ToggleEvent =
  | { type: "TOGGLE" }
  | { type: "CHECK" }
  | { type: "UNCHECK" }
  | { type: "DISABLE" }
  | { type: "ENABLE" };

export const createToggleMachine = (context: Partial<ToggleContext> = {}) =>
  createMachine<ToggleContext, ToggleEvent>({
    id: "toggle",
    initial: context.checked ? "checked" : "unchecked",
    context: {
      checked: context.checked ?? false,
      disabled: context.disabled ?? false,
    },
    states: {
      unchecked: {
        on: {
          TOGGLE: {
            target: "checked",
            actions: [assign({ checked: true })],
            cond: (ctx) => !ctx.disabled,
          },
          CHECK: {
            target: "checked",
            actions: [assign({ checked: true })],
            cond: (ctx) => !ctx.disabled,
          },
          DISABLE: {
            actions: [assign({ disabled: true })],
          },
          ENABLE: {
            actions: [assign({ disabled: false })],
          },
        },
      },
      checked: {
        on: {
          TOGGLE: {
            target: "unchecked",
            actions: [assign({ checked: false })],
            cond: (ctx) => !ctx.disabled,
          },
          UNCHECK: {
            target: "unchecked",
            actions: [assign({ checked: false })],
            cond: (ctx) => !ctx.disabled,
          },
          DISABLE: {
            actions: [assign({ disabled: true })],
          },
          ENABLE: {
            actions: [assign({ disabled: false })],
          },
        },
      },
    },
  });
