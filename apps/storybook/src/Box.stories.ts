import type { Meta, StoryObj } from "@storybook/html";
import type { As } from "@rune-ui/archtype";
import { BoxView, RuneUIBoxProps } from "@rune-ui/archtype";

const meta = {
  title: "Component/Box",
  render: (args) => {
    return new BoxView(args).render();
  },
  argTypes: {},
  args: { as: "div" },
} satisfies Meta<RuneUIBoxProps<As>>;

export default meta;
type Story = StoryObj<RuneUIBoxProps<As>>;

export const Default: Story = {
  args: {
    children: "Hello, World!",
  },
};

export const AsButton: Story = {
  args: {
    as: "button",
    children: "Click me",
  },
};
