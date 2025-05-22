import type { Meta, StoryObj } from "@storybook/html";
import type { As } from "@rune-ui/archtype";
import { ButtonView, RuneUIButtonProps } from "@rune-ui/archtype";

const meta = {
  title: "Component/Button",
  render: (args) => {
    return new ButtonView(args).render();
  },
  argTypes: {},
  args: { as: "div" },
} satisfies Meta<RuneUIButtonProps<As>>;

export default meta;
type Story = StoryObj<RuneUIButtonProps<As>>;

export const Default: Story = {
  args: {
    children: "Button",
  },
};

export const Styling: Story = {
  args: {
    children: "Button",
    style: "background-color: red; color: white;",
  },
};
