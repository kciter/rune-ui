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

export type As =
  | keyof HTMLElementTagNameMap
  | (abstract new (...args: any[]) => View<any>);

export type PropsOf<T extends As> = T extends keyof HTMLElementTagNameMap
  ? Omit<HTMLElementTagNameMap[T], "children" | "style"> & {
      style?: string;
    }
  : T extends abstract new (...args: any[]) => View<infer P>
    ? P
    : never;

export type RuneElement<T extends As> = PropsOf<T> & {};
