import type { Meta } from "@storybook/html";
import { PortalView } from "@rune-ui/archetype";
import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";

const meta = {
  title: "Utility/Portal",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

class SimplePortal extends PortalView {
  override template() {
    return (
      <div>
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: 20,
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
          }}
        >
          이 박스는 document.body에 직접 렌더링됩니다!
        </div>
      </div>
    );
  }
}

export const Basic = () => {
  // 포털 예시를 보여주기 위한 래퍼
  class PortalDemo extends View {
    override template() {
      return (
        <div style="height: 150vh; padding: 20px; background-color: #f5f5f5;">
          <div
            style={{
              padding: 20,
              marginBottom: 20,
              border: "1px solid #eaeaea",
              borderRadius: 4,
              backgroundColor: "white",
            }}
          >
            스크롤해도 포털 요소는 화면 중앙에 고정됩니다.
          </div>

          <SimplePortal />
        </div>
      );
    }
  }

  return new PortalDemo({}).render();
};

class CustomTargetPortal extends PortalView {
  override getPortalContainer(): HTMLElement {
    // 특정 ID를 가진 요소를 대상으로 지정
    const target = document.getElementById("portal-target");
    return target || document.body;
  }

  override template() {
    return (
      <div>
        <div
          style={{
            backgroundColor: "#3358e4",
            color: "white",
            padding: 15,
            borderRadius: 8,
          }}
        >
          이 요소는 #portal-target 요소 내부에 렌더링됩니다
        </div>
      </div>
    );
  }
}

export const CustomTarget = () => {
  class CustomTargetDemo extends View {
    override template() {
      return (
        <div style="padding: 20px;">
          <div style="margin-bottom: 20px;">
            아래의 회색 상자는 포털의 대상 컨테이너입니다.
          </div>

          <div
            id="portal-target"
            style="
              padding: 20px;
              background-color: #f0f0f0;
              border: 1px dashed #ccc;
              margin-bottom: 20px;
              min-height: 100px;
            "
          >
            <div>포털 대상 컨테이너 (#portal-target)</div>
          </div>

          <div style="margin-bottom: 20px;">
            원래는 이 아래에 컴포넌트가 렌더링 되어야 합니다. 하지만 포털을
            사용하여 #portal-target에 렌더링됩니다.
          </div>

          <CustomTargetPortal />
        </div>
      );
    }
  }

  return new CustomTargetDemo({}).render();
};
