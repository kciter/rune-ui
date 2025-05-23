import type { Meta } from "@storybook/html";
import { Collapsible } from "@rune-ui/archetype";
import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";
import styles from "./collapsible.module.css";

const meta = {
  title: "Component/Collapsible",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

// 기본 접을 수 있는 컴포넌트
class BasicCollapsible extends View {
  override template() {
    return (
      <div style="width: 300px;">
        <Collapsible.Root className={styles.root}>
          <div className={styles.header}>
            <Collapsible.Trigger className={styles.trigger}>
              상세 정보
            </Collapsible.Trigger>
            <Collapsible.Indicator className={styles.indicator} />
          </div>
          <Collapsible.Content className={styles.content}>
            <div className={styles.contentInner}>
              이곳은 상세 정보가 표시되는 영역입니다. 버튼을 클릭하면 이 영역이
              접히거나 펼쳐집니다. 헤드레스 컴포넌트로 구현되어 스타일링이
              자유롭습니다.
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    );
  }
}

export const Basic = () => new BasicCollapsible({}).render();

// 여러 개의 접을 수 있는 컴포넌트
class MultipleCollapsibles extends View {
  override template() {
    return (
      <div style="width: 300px; display: flex; flex-direction: column; gap: 8px;">
        <Collapsible.Root className={styles.root}>
          <div className={styles.header}>
            <Collapsible.Trigger className={styles.trigger}>
              섹션 1
            </Collapsible.Trigger>
            <Collapsible.Indicator className={styles.indicator} />
          </div>
          <Collapsible.Content className={styles.content}>
            <div className={styles.contentInner}>섹션 1의 내용입니다.</div>
          </Collapsible.Content>
        </Collapsible.Root>

        <Collapsible.Root className={styles.root}>
          <div className={styles.header}>
            <Collapsible.Trigger className={styles.trigger}>
              섹션 2
            </Collapsible.Trigger>
            <Collapsible.Indicator className={styles.indicator} />
          </div>
          <Collapsible.Content className={styles.content}>
            <div className={styles.contentInner}>섹션 2의 내용입니다.</div>
          </Collapsible.Content>
        </Collapsible.Root>

        <Collapsible.Root className={styles.root}>
          <div className={styles.header}>
            <Collapsible.Trigger className={styles.trigger}>
              섹션 3
            </Collapsible.Trigger>
            <Collapsible.Indicator className={styles.indicator} />
          </div>
          <Collapsible.Content className={styles.content}>
            <div className={styles.contentInner}>섹션 3의 내용입니다.</div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    );
  }
}

export const Multiple = () => new MultipleCollapsibles({}).render();

// 기본적으로 펼쳐진 상태
class DefaultExpanded extends View {
  override template() {
    return (
      <div style="width: 300px;">
        <Collapsible.Root expanded className={styles.root}>
          <div className={styles.header}>
            <Collapsible.Trigger className={styles.trigger}>
              이미 펼쳐진 상태
            </Collapsible.Trigger>
            <Collapsible.Indicator className={styles.indicator} />
          </div>
          <Collapsible.Content className={styles.content}>
            <div className={styles.contentInner}>
              이 컴포넌트는 기본적으로 펼쳐진 상태로 시작합니다.
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    );
  }
}

export const Expanded = () => new DefaultExpanded({}).render();

// 비활성화된 상태
class DisabledCollapsible extends View {
  override template() {
    return (
      <div style="width: 300px;">
        <Collapsible.Root disabled className={styles.root}>
          <div className={styles.header}>
            <Collapsible.Trigger
              className={`${styles.trigger} ${styles.disabled}`}
            >
              비활성화된 컴포넌트
            </Collapsible.Trigger>
            <Collapsible.Indicator
              className={`${styles.indicator} ${styles.disabled}`}
            />
          </div>
          <Collapsible.Content className={styles.content}>
            <div className={styles.contentInner}>
              이 내용은 보이지 않습니다.
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    );
  }
}

export const Disabled = () => new DisabledCollapsible({}).render();

// 사용자 정의 화살표 아이콘
class CustomIndicator extends View {
  override template() {
    return (
      <div style="width: 300px;">
        <Collapsible.Root className={styles.root}>
          <div className={styles.header}>
            <Collapsible.Trigger className={styles.trigger}>
              사용자 정의 아이콘
            </Collapsible.Trigger>
            <Collapsible.Indicator className={styles.indicator} icon="👇" />
          </div>
          <Collapsible.Content className={styles.content}>
            <div className={styles.contentInner}>
              사용자 정의 아이콘을 사용한 예제입니다.
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    );
  }
}

export const CustomIcon = () => new CustomIndicator({}).render();

// 이벤트 핸들링 예제
class CollapsibleWithEvents extends View {
  private status = "접힌 상태";
  private statusDisplay: StatusDisplay;

  constructor(props: {}) {
    super(props);
    this.statusDisplay = new StatusDisplay({ status: this.status });
  }

  override template() {
    return (
      <div style="width: 300px; display: flex; flex-direction: column; gap: 16px;">
        <Collapsible.Root
          className={styles.root}
          onExpandedChange={(expanded) => {
            this.status = expanded ? "펼쳐진 상태" : "접힌 상태";
            this.statusDisplay.data.status = this.status;
            this.statusDisplay.redraw();
          }}
        >
          <div className={styles.header}>
            <Collapsible.Trigger className={styles.trigger}>
              이벤트 핸들링
            </Collapsible.Trigger>
            <Collapsible.Indicator className={styles.indicator} />
          </div>
          <Collapsible.Content className={styles.content}>
            <div className={styles.contentInner}>
              onExpandedChange 이벤트를 통해 상태 변화를 감지합니다.
            </div>
          </Collapsible.Content>
        </Collapsible.Root>

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

export const WithEvents = () => new CollapsibleWithEvents({}).render();
