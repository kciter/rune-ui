import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";
import type { RuneChildren, RuneElement } from "@/types";
import { aspectRatioParts } from "./aspect-ratio.anatomy";

export interface RuneUIAspectRatioProps extends RuneElement<"div"> {
  /**
   * 가로세로 비율 (width/height)
   * 예: 16/9, 1, 4/3
   * @default 1
   */
  ratio?: number;

  /**
   * 컴포넌트의 내용물
   */
  children?: RuneChildren;
}

export class AspectRatio extends View<RuneUIAspectRatioProps> {
  override template() {
    const { ratio = 1, children, ...rest } = this.data;

    // 패딩 트릭을 사용하여 비율 유지 (padding-bottom은 부모 요소의 width에 대한 %)
    return (
      <div
        {...rest}
        {...aspectRatioParts.root.attrs}
        style={`
          position: relative;
          width: 100%;
          ${this.data.style || ""}
        `.trim()}
      >
        <div
          {...aspectRatioParts.padding.attrs}
          style={`
            padding-bottom: calc(100% / ${ratio});
          `.trim()}
        />
        <div
          {...aspectRatioParts.content.attrs}
          style={`
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          `.trim()}
        >
          {children}
        </div>
      </div>
    );
  }
}
