import { createHtml } from "@rune-ui/jsx";
import { RunePage } from "@rune-ui/server";

export default class AboutPage extends RunePage {
  static getMetadata() {
    return {
      title: "About - Rune UI",
      description: "Learn more about Rune UI server framework",
    };
  }

  template() {
    return (
      <div style="font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
        <header style="margin-bottom: 2rem;">
          <h1 style="color: #333;">About Rune UI Server</h1>
          <nav style="margin-top: 1rem;">
            <a href="/" style="color: #0070f3; text-decoration: none;">
              ← Back to Home
            </a>
          </nav>
        </header>

        <main>
          <section style="line-height: 1.6; margin-bottom: 2rem;">
            <h2 style="color: #333;">What is Rune UI Server?</h2>
            <p>
              Rune UI Server is a Next.js-inspired framework built specifically
              for Rune applications. It provides server-side rendering, API
              routes, and hot reload functionality while maintaining the
              reactive nature of Rune views.
            </p>
          </section>

          <section style="line-height: 1.6; margin-bottom: 2rem;">
            <h2 style="color: #333;">Key Features</h2>
            <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
              <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #333;">🎯 Rune Integration</h3>
                <p style="margin-bottom: 0;">
                  Built specifically for Rune views with full TypeScript
                  support.
                </p>
              </div>
              <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #333;">🔥 Hot Reload</h3>
                <p style="margin-bottom: 0;">
                  Instant feedback during development with WebSocket-based hot
                  reload.
                </p>
              </div>
              <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #333;">
                  📁 File-based Routing
                </h3>
                <p style="margin-bottom: 0;">
                  Automatic routing based on your file structure, just like
                  Next.js.
                </p>
              </div>
              <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-top: 0; color: #333;">⚡ SPA Navigation</h3>
                <p style="margin-bottom: 0;">
                  Client-side navigation for fast page transitions.
                </p>
              </div>
            </div>
          </section>

          <section style="line-height: 1.6;">
            <h2 style="color: #333;">Architecture</h2>
            <p>
              The framework is built on Express.js and uses a modular
              architecture:
            </p>
            <ul>
              <li>
                <strong>Server:</strong> Express-based server with middleware
                support
              </li>
              <li>
                <strong>Router:</strong> File-system based routing with dynamic
                route support
              </li>
              <li>
                <strong>Pages:</strong> Rune View-based page components with SSR
              </li>
              <li>
                <strong>API:</strong> Express-style API route handlers
              </li>
              <li>
                <strong>Client:</strong> Lightweight client-side navigation and
                hot reload
              </li>
            </ul>
          </section>
        </main>
      </div>
    );
  }
}
