import { html } from "rune-ts";
import { RunePage } from "@rune-ui/server";
import { createHtml } from "@rune-ui/jsx";

interface HomePageProps {
  fetchData?: any;
  message?: string;
  currentTime?: string;
}

export default class HomePage extends RunePage<HomePageProps> {
  getMetadata() {
    return {
      title: "Rune UI - Home",
      description: "Welcome to Rune UI server framework",
      ogTitle: "Rune UI Server Framework",
      ogDescription: "A powerful SSR framework for Rune applications",
    };
  }

  async getServerSideProps() {
    console.log("🚀 [HomePage] getServerSideProps called!!");
    const fetchData = await fetch(
      "https://jsonplaceholder.typicode.com/posts/1",
    ).then((res) => res.json());
    console.log(fetchData);

    return {
      props: {
        fetchData,
        message: "Hello from server side!",
        currentTime: new Date().toISOString(),
      },
    };
  }

  template() {
    const { message, currentTime } = this.data;

    return (
      <div style="font-family: 'Inter', system-ui, sans-serif; width: 800px; margin: 0 auto; padding: 2rem;">
        <section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3rem 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
          <h1 style="margin: 0 0 1rem 0; font-size: 2.5rem; font-weight: 700;">
            🎯 Welcome to Rune UI - UPDATED!
          </h1>
          <p style="font-size: 1.2rem; margin: 0; opacity: 0.9;">
            A powerful SSR framework built on Rune
          </p>
          <pre>
            <code>{JSON.stringify(this.data.fetchData, null, 2)}</code>
          </pre>
        </section>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-bottom: 3rem;">
          <div style="background: #f8f9fa; padding: 2rem; border-radius: 8px; border-left: 4px solid #0070f3;">
            <h3 style="margin-top: 0; color: #0070f3;">Server Message</h3>
            <p style="margin: 0;">{message}</p>
          </div>

          <div style="background: #f8f9fa; padding: 2rem; border-radius: 8px; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #28a745;">Generated At</h3>
            <p style="margin: 0; font-family: monospace;">{currentTime}</p>
          </div>
        </div>

        <section style="margin-bottom: 3rem;">
          <h2 style="color: #333; margin-bottom: 1.5rem;">🚀 Features</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
            {this.renderFeatureCard(
              "🎯",
              "Rune Components",
              "Built on top of Rune's reactive system",
            )}
            {this.renderFeatureCard(
              "🔥",
              "Hot Reload",
              "Fast development with instant updates",
            )}
            {this.renderFeatureCard(
              "📁",
              "File-based Routing",
              "Automatic routing based on file structure",
            )}
            {this.renderFeatureCard(
              "🚀",
              "API Routes",
              "Build APIs alongside your pages",
            )}
            {this.renderFeatureCard(
              "⚡",
              "SPA Navigation",
              "Client-side navigation for better UX",
            )}
            {this.renderFeatureCard(
              "🛠️",
              "TypeScript",
              "Full TypeScript support out of the box",
            )}
          </div>
        </section>

        <section>
          <h2 style="color: #333; margin-bottom: 1.5rem;">🧭 Navigation</h2>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            {this.renderNavButton("/about", "About Page", "#0070f3")}
            {this.renderNavButton("/users/123", "User Profile", "#28a745")}
            {this.renderNavButton("/api/hello", "API Test", "#ffc107")}
            {this.renderNavButton("/test", "Test", "#ffc107")}
          </div>
        </section>
      </div>
    );
  }

  private renderFeatureCard(icon: string, title: string, description: string) {
    return html`
      <div
        style="background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e9ecef;"
      >
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">${icon}</div>
        <h3 style="margin: 0 0 0.5rem 0; color: #333; font-size: 1.1rem;">
          ${title}
        </h3>
        <p style="margin: 0; color: #666; font-size: 0.9rem;">${description}</p>
      </div>
    `;
  }

  private renderNavButton(href: string, text: string, color: string) {
    return html`
      <a
        href="${href}"
        style="
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: ${color};
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      "
        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
        >${text}</a
      >
    `;
  }
}
