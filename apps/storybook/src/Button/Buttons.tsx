import { Button } from "@rune-ui/archetype";
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

// 스타일이 적용된 버튼 (내부 스타일 고정)
type StyledButtonProps = SimpleButtonProps;

export class StyledButton extends View<StyledButtonProps> {
  override template() {
    const { label, leftIconView, rightIconView, disabled } = this.data;

    return (
      <Button.Root
        disabled={disabled}
        style="
          background: linear-gradient(90deg, #4f8cff 0%, #3358e4 100%);
          border: none;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(79,140,255,0.15);
          cursor: pointer;
          transition: background 0.2s;
          padding: 0;
          min-width: 120px;
        "
      >
        <Button.Inner
          style="
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 28px;
          "
        >
          {leftIconView && (
            <Button.LeftIcon
              icon={leftIconView}
              style="
                font-size: 1.2rem;
                margin-right: 4px;
                color: #dbeafe;
              "
            />
          )}
          <Button.Label
            style="
              font-size: 1rem;
              font-weight: 700;
              color: #fff;
              letter-spacing: 0.02em;
            "
          >
            {label}
          </Button.Label>
          {rightIconView && (
            <Button.RightIcon
              icon={rightIconView}
              style="
                font-size: 1.2rem;
                margin-left: 4px;
                color: #dbeafe;
              "
            />
          )}
        </Button.Inner>
      </Button.Root>
    );
  }
}

// 아이콘 전용(정사각형) 버튼 (내부 스타일 고정)
interface IconButtonProps {
  iconView: View;
  disabled?: boolean;
}

export class IconButton extends View<IconButtonProps> {
  override template() {
    const { iconView, disabled } = this.data;

    return (
      <Button.Root
        disabled={disabled}
        style="
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f5f6fa;
          color: #3358e4;
          border: 1.5px solid #e0e4ef;
          font-size: 1.25rem;
          box-shadow: 0 1px 4px rgba(51,88,228,0.08);
          cursor: pointer;
          transition: background 0.2s;
        "
      >
        <Button.Inner>
          <Button.LeftIcon icon={iconView} />
        </Button.Inner>
      </Button.Root>
    );
  }
}

export class NoJSXButton extends View<SimpleButtonProps> {
  override template() {
    return html`
      <div>
        ${new Button.Root({
          disabled: false,
          style: "background-color: #3b82f6; color: #fff; padding: 10px;",
          children: [
            new Button.Inner({
              style: "display: flex; align-items: center; gap: 10px;",
              children: html`
                Hi!!!!
                ${new Button.Label({
                  children: "Button",
                  style: "font-size: 1rem; font-weight: 700; color: #fff;",
                })}
              `,
            }),
          ],
        })}
      </div>
    `;
  }
}
