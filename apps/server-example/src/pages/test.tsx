import { createHtml } from "@rune-ui/jsx";
import { RunePage } from "@rune-ui/server";
import { html, View } from "rune-ts";

export default class TestPage extends RunePage {
  static getMetadata() {
    return {
      title: "About - Rune UI",
      description: "Learn more about Rune UI server framework",
    };
  }

  template() {
    return (
      <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
        Test
        <TestComponent message="Hi!" />
      </div>
    );
  }

  onMount(): void {
    console.log("TestPage mounted with data:", this.data);
  }

  onRender() {
    console.log("TestPage rendered with data:", this.data);
  }
}

interface TestComponentProps {
  message: string;
}

export class TestComponent extends View<TestComponentProps> {
  template() {
    return html`<button>${this.data.message}</button>`;
  }

  protected onMount(): void {
    console.log("TestComponent mounted with data:", this.data);
  }

  override onRender(): void {
    console.log("TestComponent mounted with data");
    this.element().addEventListener("click", () => {
      console.log("Button clicked in TestComponent");
      this.data.message = "Button was clicked!";
      this.redraw();
    });
  }
}
