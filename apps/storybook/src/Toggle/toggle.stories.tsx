import type { Meta } from "@storybook/html";
import { Toggle } from "@rune-ui/archtype";
import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";
import styles from "./toggle.module.css";

const meta = {
  title: "Component/Toggle",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

// 기본 토글
class BasicToggle extends View {
  override template() {
    return (
      <div>
        <Toggle.Root className={styles.root}>
          <Toggle.Track className={styles.track}>
            <Toggle.Thumb className={styles.thumb} />
          </Toggle.Track>
        </Toggle.Root>
      </div>
    );
  }
}

export const Basic = () => new BasicToggle({}).render();

// 라벨이 있는 토글
class ToggleWithLabel extends View {
  override template() {
    return (
      <div className={styles["toggle-container"]}>
        <Toggle.Root className={styles.root}>
          <Toggle.Track className={styles.track}>
            <Toggle.Thumb className={styles.thumb} />
          </Toggle.Track>
          <Toggle.Label className={styles.label}>이메일 알림 수신</Toggle.Label>
        </Toggle.Root>
      </div>
    );
  }
}

export const WithLabel = () => new ToggleWithLabel({}).render();

// 비활성화된 토글
class DisabledToggle extends View {
  override template() {
    return (
      <div className={styles["toggle-group"]}>
        <Toggle.Root disabled>
          <Toggle.Track
            className={`${styles.track} ${styles["track-disabled"]}`}
          >
            <Toggle.Thumb className={styles.thumb} />
          </Toggle.Track>
          <Toggle.Label
            className={`${styles.label} ${styles["label-disabled"]}`}
          >
            비활성화 (꺼짐)
          </Toggle.Label>
        </Toggle.Root>

        <Toggle.Root disabled checked>
          <Toggle.Track
            className={`${styles.track} ${styles["track-disabled"]}`}
          >
            <Toggle.Thumb className={styles.thumb} />
          </Toggle.Track>
          <Toggle.Label
            className={`${styles.label} ${styles["label-disabled"]}`}
          >
            비활성화 (켜짐)
          </Toggle.Label>
        </Toggle.Root>
      </div>
    );
  }
}

export const Disabled = () => new DisabledToggle({}).render();

// 다양한 크기의 토글
class ToggleSizes extends View {
  override template() {
    return (
      <div className={styles["toggle-group"]}>
        <div className={styles["toggle-container"]}>
          <Toggle.Root className={styles.root}>
            <Toggle.Track className={`${styles.track} ${styles["track-sm"]}`}>
              <Toggle.Thumb
                className={`${styles.thumb} ${styles["thumb-sm"]}`}
              />
            </Toggle.Track>
            <Toggle.Label className={styles.label}>작은 크기</Toggle.Label>
          </Toggle.Root>
        </div>

        <div className={styles["toggle-container"]}>
          <Toggle.Root className={styles.root}>
            <Toggle.Track className={styles.track}>
              <Toggle.Thumb className={styles.thumb} />
            </Toggle.Track>
            <Toggle.Label className={styles.label}>중간 크기</Toggle.Label>
          </Toggle.Root>
        </div>

        <div className={styles["toggle-container"]}>
          <Toggle.Root className={styles.root}>
            <Toggle.Track className={`${styles.track} ${styles["track-lg"]}`}>
              <Toggle.Thumb
                className={`${styles.thumb} ${styles["thumb-lg"]}`}
              />
            </Toggle.Track>
            <Toggle.Label className={styles.label}>큰 크기</Toggle.Label>
          </Toggle.Root>
        </div>
      </div>
    );
  }
}

export const Sizes = () => new ToggleSizes({}).render();

// 다양한 스타일의 토글
class StyledToggles extends View {
  override template() {
    return (
      <div className={styles["toggle-group"]}>
        {/* 녹색 스타일 */}
        <div className={styles["toggle-container"]}>
          <Toggle.Root className={styles.root}>
            <Toggle.Track
              className={`${styles.track} ${styles["track-green"]}`}
            >
              <Toggle.Thumb className={styles.thumb} />
            </Toggle.Track>
            <Toggle.Label className={styles.label}>녹색 토글</Toggle.Label>
          </Toggle.Root>
        </div>

        {/* 보라색 스타일 */}
        <div className={styles["toggle-container"]}>
          <Toggle.Root className={styles.root}>
            <Toggle.Track
              className={`${styles.track} ${styles["track-purple"]}`}
            >
              <Toggle.Thumb className={styles.thumb} />
            </Toggle.Track>
            <Toggle.Label className={styles.label}>보라색 토글</Toggle.Label>
          </Toggle.Root>
        </div>

        {/* 사각형 스타일 */}
        <div className={styles["toggle-container"]}>
          <Toggle.Root className={styles.root}>
            <Toggle.Track
              className={`${styles.track} ${styles["track-orange"]} ${styles["track-square"]}`}
            >
              <Toggle.Thumb
                className={`${styles.thumb} ${styles["thumb-square"]}`}
              />
            </Toggle.Track>
            <Toggle.Label className={styles.label}>사각형 토글</Toggle.Label>
          </Toggle.Root>
        </div>
      </div>
    );
  }
}

export const Styled = () => new StyledToggles({}).render();

// 이벤트 핸들링 예제
class ToggleWithEvents extends View {
  private status = "꺼짐";
  private statusDisplay: StatusDisplay;

  constructor(props: {}) {
    super(props);
    this.statusDisplay = new StatusDisplay({ status: this.status });
  }

  override template() {
    return (
      <div className={styles["toggle-group"]}>
        <div className={styles["toggle-container"]}>
          <Toggle.Root
            onCheckedChange={(checked) => {
              this.status = checked ? "켜짐" : "꺼짐";
              this.statusDisplay.data.status = this.status;
              this.statusDisplay.redraw();
            }}
          >
            <Toggle.Track className={styles.track}>
              <Toggle.Thumb className={styles.thumb} />
            </Toggle.Track>
          </Toggle.Root>
        </div>

        {this.statusDisplay}
      </div>
    );
  }
}

class StatusDisplay extends View<{ status: string }> {
  override template() {
    return (
      <div style="padding: 12px; border-radius: 6px; background-color: #f8fafc; font-size: 14px;">
        현재 상태: <strong className="status">{this.data.status}</strong>
      </div>
    );
  }
}

export const WithEvents = () => new ToggleWithEvents({}).render();
