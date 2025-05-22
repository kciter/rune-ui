import type { Meta } from "@storybook/html";
import { Box } from "@rune-ui/archtype";
import { IconButton, SimpleButton, StyledButton, NoJSXButton } from "./Buttons";

const meta = {
  title: "Component/Button",
  parameters: {
    layout: "centered",
  },
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

// 외부 이벤트 바인딩
export const WithClick = () => {
  const button = new SimpleButton({
    label: "Click me!",
  });

  // DOM Redraw 없음
  button.addEventListener("click", () => {
    if (button.element().style.backgroundColor === "lightblue") {
      button.element().style.backgroundColor = "";
    } else {
      button.element().style.backgroundColor = "lightblue";
    }
  });

  return button.render();
};

export const NoJSX = () =>
  new NoJSXButton({
    label: "No JSX Button",
    leftIconView: new Box({
      as: "span",
      children: "👈",
    }),
    rightIconView: new Box({
      as: "span",
      children: "👉",
    }),
  }).render();
