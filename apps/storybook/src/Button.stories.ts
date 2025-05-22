import type { Meta, StoryObj } from "@storybook/html";
import { BoxView, ButtonView } from "@rune-ui/archtype";
import { html } from "rune-ts";

const meta = {
  title: "Component/Button",
} satisfies Meta;

export default meta;

// 기본 버튼
export const Default = () => new ButtonView({ children: "Button" }).render();

// 아이콘 버튼
export const WithIcons = () =>
  new ButtonView({
    children: "Button",
    leftIconView: new BoxView({ as: "span", children: "👈" }),
    rightIconView: new BoxView({ as: "span", children: "👉" }),
  }).render();

// 로딩 상태
export const Loading = () =>
  new ButtonView({
    children: "Button",
    loading: true,
    spinnerText: "Loading...",
    spinnerView: new BoxView({ as: "span", children: "⏳" }),
  }).render();

// 스타일 적용
export const Styling = () =>
  new ButtonView({
    children: "Button",
    style: "background-color: red; color: white;",
  }).render();
