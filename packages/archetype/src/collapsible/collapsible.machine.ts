import { createMachine, assign } from "@rune-ui/machine";

export interface CollapsibleContext {
  /**
   * 콘텐츠의 확장 상태
   */
  expanded: boolean;

  /**
   * 비활성화 상태
   */
  disabled: boolean;
}

export type CollapsibleEvent =
  | { type: "TOGGLE" }
  | { type: "EXPAND" }
  | { type: "COLLAPSE" }
  | { type: "DISABLE" }
  | { type: "ENABLE" };

export const createCollapsibleMachine = (
  context: Partial<CollapsibleContext> = {},
) =>
  createMachine<CollapsibleContext, CollapsibleEvent>({
    id: "collapsible",
    initial: context.expanded ? "expanded" : "collapsed",
    context: {
      expanded: context.expanded ?? false,
      disabled: context.disabled ?? false,
    },
    states: {
      collapsed: {
        on: {
          TOGGLE: {
            target: "expanded",
            actions: [assign({ expanded: true })],
            cond: (ctx) => !ctx.disabled,
          },
          EXPAND: {
            target: "expanded",
            actions: [assign({ expanded: true })],
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
      expanded: {
        on: {
          TOGGLE: {
            target: "collapsed",
            actions: [assign({ expanded: false })],
            cond: (ctx) => !ctx.disabled,
          },
          COLLAPSE: {
            target: "collapsed",
            actions: [assign({ expanded: false })],
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
