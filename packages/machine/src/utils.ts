import { Context, EventName } from "./types";

// 여러 액션을 결합하는 헬퍼 함수
export function assign<
  TContext extends Context,
  TEvent extends { type: EventName }
>(
  assignment:
    | Partial<TContext>
    | ((context: TContext, event: TEvent) => Partial<TContext>)
) {
  return (context: TContext, event: TEvent) => {
    const update =
      typeof assignment === "function"
        ? assignment(context, event)
        : assignment;

    Object.assign(context, update);
  };
}
