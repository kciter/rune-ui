import { Html, html, View } from "rune-ts";

export interface DocumentProps {
  metadata: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    [key: string]: any;
  };
  clientScript?: string;
  pageData: any;
  children: Html;
}

/**
 * 기본 Document 클래스
 * Next.js의 _document.tsx와 유사한 역할
 */
export class Document extends View<DocumentProps> {
  template(): Html {
    const { metadata, clientScript, pageData, children } = this.data;
    const isDev = process.env.NODE_ENV !== "production";

    return html`<!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${metadata.title || "Rune App"}</title>
          ${this.renderMetaTags(metadata)} ${this.renderStyles()}
          ${this.renderHeadContent()}
        </head>
        <body>
          ${this.renderBodyStart()}
          <div id="__rune_root__">${children}</div>
          ${this.renderBodyEnd()}

          <script>
            window.__RUNE_DATA__ = ${JSON.stringify(pageData)};
          </script>
          ${clientScript ? `<script>${clientScript}</script>` : ""}
          <script src="/__rune_client__.js"></script>
          ${isDev ? html`<script src="/__hot_reload__.js"></script>` : ""}
        </body>
      </html>`;
  }

  /**
   * 메타 태그 렌더링
   */
  protected renderMetaTags(metadata: DocumentProps["metadata"]): Html {
    const metaTags = [
      metadata.description &&
        html`<meta name="description" content="${metadata.description}" />`,
      metadata.keywords &&
        html`<meta name="keywords" content="${metadata.keywords}" />`,
      metadata.ogTitle &&
        html`<meta property="og:title" content="${metadata.ogTitle}" />`,
      metadata.ogDescription &&
        html`<meta
          property="og:description"
          content="${metadata.ogDescription}"
        />`,
      metadata.ogImage &&
        html`<meta property="og:image" content="${metadata.ogImage}" />`,
      html`<link rel="icon" href="/favicon.ico" />`,
    ].filter(Boolean);

    return html`${metaTags}`;
  }

  /**
   * 기본 스타일 렌더링
   */
  protected renderStyles(): Html {
    return html`
      <style>
        /* 기본 CSS 리셋 */
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: system-ui, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        a {
          color: #0070f3;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    `;
  }

  /**
   * 추가 head 컨텐츠 (오버라이드 가능)
   */
  protected renderHeadContent(): Html {
    return html``;
  }

  /**
   * body 시작 부분 (오버라이드 가능)
   */
  protected renderBodyStart(): Html {
    return html``;
  }

  /**
   * body 끝 부분 (오버라이드 가능)
   */
  protected renderBodyEnd(): Html {
    return html``;
  }
}
