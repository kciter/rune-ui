import { View } from "rune-ts";
import { createHtml } from "@rune-ui/jsx";

export class PortalView<T extends object = {}> extends View<T> {
  private id: string = `portal-${Math.random().toString(36).substring(2, 9)}`;
  private portalElement: HTMLElement | null = null;
  private observer: MutationObserver | null = null;

  constructor(props: T) {
    super(props);
  }

  // 포털 타겟을 지정할 수 있는 메서드 (기본: document.body)
  protected getPortalContainer(): HTMLElement {
    return document.body;
  }

  override onMount() {
    const targetContainer = this.getPortalContainer();
    console.log(`포털이 렌더링될 대상 컨테이너: ${targetContainer.id}`);

    // Portal 요소 생성
    this.portalElement = document.createElement("div");
    this.portalElement.setAttribute("data-rune-ui-portal", "");

    // DOM에 렌더링된 실제 요소 찾기
    const element = this.element();

    if (element && this.portalElement) {
      // 렌더링된 내용을 포털 요소로 복제
      Array.from(element.childNodes).forEach((child) => {
        this.portalElement!.appendChild(child.cloneNode(true));
      });

      // 대상 컨테이너에 포털 요소 추가
      targetContainer.appendChild(this.portalElement);

      // 원본 요소 숨기기
      element.style.display = "none";

      // 뷰가 업데이트될 때 포털 내용도 업데이트하기 위한 MutationObserver 설정
      this.observer = new MutationObserver(() => {
        if (element && this.portalElement) {
          // 기존 포털 내용 제거
          while (this.portalElement.firstChild) {
            this.portalElement.removeChild(this.portalElement.firstChild);
          }

          // 새 내용 복제하여 추가
          Array.from(element.childNodes).forEach((child) => {
            this.portalElement!.appendChild(child.cloneNode(true));
          });
        }
      });

      this.observer.observe(element, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }
  }

  override onUnmount() {
    // MutationObserver 해제
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // 포털 요소 제거
    if (this.portalElement) {
      const container = this.getPortalContainer();
      if (container.contains(this.portalElement)) {
        container.removeChild(this.portalElement);
      }
      this.portalElement = null;
    }
  }
}
