import type { Meta } from "@storybook/html";
import { AspectRatio } from "@rune-ui/archtype";
import { Box } from "@rune-ui/archtype";
import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";

const meta = {
  title: "Component/AspectRatio",
} satisfies Meta;

export default meta;

class AspectRatioExample extends View<{
  ratio: number;
  backgroundColor?: string;
}> {
  override template() {
    const { ratio, backgroundColor = "#0072de" } = this.data;

    return (
      <AspectRatio ratio={ratio} style="max-width: 300px; margin-bottom: 20px;">
        <Box
          style={`
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: ${backgroundColor};
            color: white;
            font-weight: bold;
            border-radius: 8px;
          `}
        >
          {ratio}:1
        </Box>
      </AspectRatio>
    );
  }
}

// 정사각형 (1:1)
export const Square = () =>
  new AspectRatioExample({
    ratio: 1,
  }).render();

// 와이드스크린 (16:9)
export const Widescreen = () =>
  new AspectRatioExample({
    ratio: 16 / 9,
    backgroundColor: "#8952e0",
  }).render();

// 4:3 비율
export const Standard = () =>
  new AspectRatioExample({
    ratio: 4 / 3,
    backgroundColor: "#e06c52",
  }).render();

// 이미지 예제
export const WithImage = () =>
  new AspectRatio({
    ratio: 16 / 9,
    style: "max-width: 500px;",
    children: (
      <img
        src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f"
        style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"
      />
    ),
  }).render();
