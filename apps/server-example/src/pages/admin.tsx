import { createHtml } from "@rune-ui/jsx";
import { RunePage } from "@rune-ui/server";

export default class AdminPage extends RunePage {
  static getMetadata() {
    return {
      title: "About - Rune UI",
      description: "Learn more about Rune UI server framework",
    };
  }

  template() {
    return (
      <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
        asdf
      </div>
    );
  }
}
