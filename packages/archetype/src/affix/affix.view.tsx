import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";
import { RuneElement, RuneChildren } from "@rune-ui/types";
import { affixParts } from "./affix.anatomy";

export interface RuneUIAffixProps extends RuneElement<"div"> {
  /**
   * 상단으로부터의 거리 (px 또는 % 단위)
   */
  top?: number | string;

  /**
   * 하단으로부터의 거리 (px 또는 % 단위)
   */
  bottom?: number | string;

  /**
   * 왼쪽으로부터의 거리 (px 또는 % 단위)
   */
  left?: number | string;

  /**
   * 오른쪽으로부터의 거리 (px 또는 % 단위)
   */
  right?: number | string;

  /**
   * position 속성 값 (기본값: fixed)
   */
  position?: "fixed" | "absolute";

  /**
   * z-index 값
   */
  zIndex?: number;

  /**
   * 컴포넌트 자식 요소
   */
  children?: RuneChildren;
}

export class Affix extends View<RuneUIAffixProps> {
  override template() {
    const {
      top,
      bottom,
      left,
      right,
      position = "fixed",
      zIndex = 100,
      children,
      ...rest
    } = this.data;

    // position 값 유효성 검사
    const validPosition = ["fixed", "absolute"].includes(position)
      ? position
      : "fixed";

    // 단위가 있는 값으로 변환
    const topValue = typeof top === "number" ? `${top}px` : top;
    const bottomValue = typeof bottom === "number" ? `${bottom}px` : bottom;
    const leftValue = typeof left === "number" ? `${left}px` : left;
    const rightValue = typeof right === "number" ? `${right}px` : right;

    return (
      <div
        {...rest}
        {...affixParts.root.attrs}
        style={`
          position: ${validPosition};
          ${topValue !== undefined ? `top: ${topValue};` : ""}
          ${bottomValue !== undefined ? `bottom: ${bottomValue};` : ""}
          ${leftValue !== undefined ? `left: ${leftValue};` : ""}
          ${rightValue !== undefined ? `right: ${rightValue};` : ""}
          z-index: ${zIndex};
          ${this.data.style || ""}
        `.trim()}
      >
        <div {...affixParts.content.attrs}>{children}</div>
      </div>
    );
  }

  override onRender(): void {
    super.onRender();
    const { top, bottom, left, right, position } = this.data;

    // Affix 위치 조정
    if (top) {
      this.element().style.top = typeof top === "number" ? `${top}px` : top;
    }
    if (bottom) {
      this.element().style.bottom =
        typeof bottom === "number" ? `${bottom}px` : bottom;
    }
    if (left) {
      this.element().style.left = typeof left === "number" ? `${left}px` : left;
    }
    if (right) {
      this.element().style.right =
        typeof right === "number" ? `${right}px` : right;
    }
    if (position) {
      this.element().style.position = position;
    }
  }
}
