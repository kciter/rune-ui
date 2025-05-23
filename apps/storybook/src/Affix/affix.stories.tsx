import type { Meta } from "@storybook/html";
import { Affix, PortalView } from "@rune-ui/archetype";
import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";

const meta = {
  title: "Component/Affix",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

// 기본 Affix
class BasicAffix extends View {
  override template() {
    return (
      <div style="height: 120vh; padding: 20px;">
        <div
          style="
            padding: 20px;
            border: 1px solid #eaeaea;
            border-radius: 4px;
            margin-bottom: 20px;
          "
        >
          스크롤해보세요!
        </div>

        <Affix top={20} right={20}>
          <div
            style="
              padding: 16px;
              background-color: #3358e4;
              color: white;
              border-radius: 8px;
              div-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              width: 120px;
              text-align: center;
            "
          >
            상단 고정
          </div>
        </Affix>

        <Affix bottom={20} right={20}>
          <div
            style="
              padding: 16px;
              background-color: #f97316;
              color: white;
              border-radius: 8px;
              div-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              width: 120px;
              text-align: center;
            "
          >
            하단 고정
          </div>
        </Affix>
      </div>
    );
  }
}

export const Basic = () => new BasicAffix({}).render();

// 다양한 위치의 Affix
class AffixPositions extends View {
  override template() {
    return (
      <div style="height: 150vh; padding: 20px; position: relative;">
        <div
          style="
            padding: 20px;
            border: 1px solid #eaeaea;
            border-radius: 4px;
            margin-bottom: 20px;
          "
        >
          스크롤해보세요. 다양한 위치에 고정된 요소들이 있습니다.
        </div>

        <Affix top={20} left={20}>
          <div
            style="
              padding: 12px;
              background-color: #3358e4;
              color: white;
              border-radius: 8px;
              div-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              width: 100px;
              text-align: center;
            "
          >
            좌측 상단
          </div>
        </Affix>

        <Affix top={20} right={20}>
          <div
            style="
              padding: 12px;
              background-color: #10b981;
              color: white;
              border-radius: 8px;
              div-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              width: 100px;
              text-align: center;
            "
          >
            우측 상단
          </div>
        </Affix>

        <Affix bottom={20} left={20}>
          <div
            style="
              padding: 12px;
              background-color: #8b5cf6;
              color: white;
              border-radius: 8px;
              div-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              width: 100px;
              text-align: center;
            "
          >
            좌측 하단
          </div>
        </Affix>

        <Affix bottom={20} right={20}>
          <div
            style="
              padding: 12px;
              background-color: #f97316;
              color: white;
              border-radius: 8px;
              div-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              width: 100px;
              text-align: center;
            "
          >
            우측 하단
          </div>
        </Affix>
      </div>
    );
  }
}

export const Positions = () => new AffixPositions({}).render();

// Absolute 위치 지정
class AbsoluteAffix extends View {
  override template() {
    return (
      <div style="height: 400px; border: 1px solid #eaeaea; position: relative; margin: 40px; padding: 20px;">
        <div style="margin-bottom: 20px;">
          이 컨테이너 내에서만 Affix가 적용됩니다.
        </div>

        <Affix top={20} right={20} position="absolute">
          <div
            style="
              padding: 12px;
              background-color: #3358e4;
              color: white;
              border-radius: 8px;
              width: 140px;
              text-align: center;
            "
          >
            Absolute 포지션
          </div>
        </Affix>
      </div>
    );
  }
}

export const AbsolutePosition = () => new AbsoluteAffix({}).render();

// Absolute 위치 지정
class PortalAffix extends PortalView {
  override template() {
    return (
      <div>
        <Affix top={20} right={20} position="absolute">
          <div
            style="
              padding: 12px;
              background-color: #3358e4;
              color: white;
              border-radius: 8px;
              width: 360px;
              text-align: center;
            "
          >
            Portal을 사용하여 document.body에 렌더링됩니다.
          </div>
        </Affix>
      </div>
    );
  }
}

export const WithPortal = () => new PortalAffix({}).render();
