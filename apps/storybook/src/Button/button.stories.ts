import type { Meta } from "@storybook/html";
import { IconButton, SimpleButton, StyledButton } from "./Buttons";
import { Box } from "@rune-ui/archtype";

const meta = {
  title: "Component/Button",
} satisfies Meta;

export default meta;

// 기본 버튼
export const Default = () =>
  new SimpleButton({
    label: "Button",
  }).render();

// 왼쪽 아이콘 버튼
export const WithLeftIcon = () =>
  new SimpleButton({
    label: "Button",
    leftIconView: new Box({
      as: "span",
      children: "👈",
    }),
  }).render();

// 오른쪽 아이콘 버튼
export const WithRightIcon = () =>
  new SimpleButton({
    label: "Button",
    rightIconView: new Box({
      as: "span",
      children: "👉",
    }),
  }).render();

// 비활성화 버튼
export const Disabled = () =>
  new SimpleButton({
    label: "Disabled",
    disabled: true,
  }).render();

// 스타일 버튼
export const Styled = () =>
  new StyledButton({
    label: "Styled Button",
    leftIconView: new Box({ as: "span", children: "🌈" }),
    rightIconView: new Box({ as: "span", children: "✨" }),
  }).render();

// 아이콘 버튼
export const OnlyIcon = () =>
  new IconButton({
    iconView: new Box({ as: "span", children: "🔔" }),
  }).render();
