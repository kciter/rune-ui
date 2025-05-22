import type { Meta } from "@storybook/html";
import { Box } from "@rune-ui/archtype";

const meta = {
  title: "Component/Box",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

export const Default = () => new Box({ children: "Hello, Rune!" }).render();

export const AsButton = () =>
  new Box({
    as: "button",
    children: "Button",
  }).render();
