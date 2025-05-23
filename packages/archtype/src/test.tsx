import { Button } from "./button";
import { html, View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";

// Prop 제한
interface SimpleButtonProps {
  label: string;
  leftIconView?: View;
  rightIconView?: View;
  disabled?: boolean;
}

export class SimpleButton extends View<SimpleButtonProps> {
  override template() {
    const { label, leftIconView, rightIconView, disabled } = this.data;

    return (
      <Button.Root disabled={disabled}>
        <Button.Inner>
          {leftIconView && <Button.LeftIcon icon={leftIconView} />}
          <Button.Label>{label}</Button.Label>
          {rightIconView && <Button.RightIcon icon={rightIconView} />}
        </Button.Inner>
      </Button.Root>
    );
  }
}
