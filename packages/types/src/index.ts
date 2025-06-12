import type * as CSS from "csstype";
import type { Html, View } from "rune-ts";

export type RuneView =
  | View<any>
  | Html
  | string
  | number
  | boolean
  | null
  | undefined;

export type RuneChildren = RuneView | RuneView[];

export interface RuneCSSProperties
  extends CSS.Properties<(string & {}) | number> {}

export type As =
  | keyof HTMLElementTagNameMap
  | (abstract new (...args: any[]) => View<any>);

export type PropsOf<T extends As> = T extends keyof HTMLElementTagNameMap
  ? Partial<Omit<HTMLElementTagNameMap[T], "children" | "style">> & {
      style?: string | RuneCSSProperties;
    }
  : T extends abstract new (...args: any[]) => View<infer P>
    ? Partial<P>
    : never;

export type RuneElement<T extends As> = PropsOf<T> & {};
