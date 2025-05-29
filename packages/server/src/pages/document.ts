import { View, html } from "rune-ts"; // html을 rune-ts에서 직접 가져옵니다.
import { Html as RuneHtml } from "rune-ts"; // Html 타입을 RuneHtml로 가져옵니다.

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
  children: RuneHtml; // Html 타입을 RuneHtml로 변경합니다.
  pageClientScriptPath?: string; // 페이지별 클라이언트 스크립트 경로 추가
  propsStoreData?: any; // Props Store 데이터 추가
}

/**
 * 기본 Document 클래스
 * Next.js의 _document.tsx와 유사한 역할
 */
export class Document extends View<DocumentProps> {
  template(): RuneHtml {
    // Html 타입을 RuneHtml로 변경합니다.
    const {
      metadata,
      children,
      pageData,
      clientScript,
      pageClientScriptPath,
      propsStoreData,
    } = this.data; // propsStoreData 추가
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
          <div id="__rune_root__" ${this._documentAddRuneAttrs(false)}>
            ${children}
          </div>
          ${this.renderBodyEnd()}

          <script>
            window.__RUNE_DATA__ = ${JSON.stringify(pageData)};
          </script>
          ${propsStoreData
            ? html`<script>
                window.__RUNE_PROPS_STORE_DATA__ = ${JSON.stringify(
                  propsStoreData,
                )};
              </script>`
            : ""}
          <script src="/props-store.js"></script>
          ${clientScript
            ? html`<script>
                ${clientScript};
              </script>`
            : ""}
          ${pageClientScriptPath
            ? html`<script
                type="module"
                src="${pageClientScriptPath}"
              ></script>`
            : ""}
          <script src="/__rune_client__.js"></script>
          ${isDev ? html`<script src="/__hot_reload__.js"></script>` : ""}
        </body>
      </html>`;
  }

  // toHtmlSSR 또는 toHtml 메서드를 오버라이드하여 template()의 결과를 직접 반환
  override toHtml(isSSR: boolean = false): string {
    const templateOutput = this.template();

    // Html 객체를 문자열로 변환 시도
    const htmlString = this._renderRuneTsHtmlObject(templateOutput, isSSR);
    return htmlString;
  }

  private _renderRuneTsHtmlObject(item: any, isSSR: boolean): string {
    if (
      item &&
      typeof item === "object" &&
      item.constructor?.name === "Html" &&
      Array.isArray(item._templateStrs) &&
      Array.isArray(item._templateVals)
    ) {
      // console.log(`[_renderRuneTsHtmlObject] Processing Html object. Strs: ${item._templateStrs.length}, Vals: ${item._templateVals.length}`);
      let result = "";
      const strs = item._templateStrs as string[];
      const vals = item._templateVals as any[];
      for (let i = 0; i < strs.length; i++) {
        result += strs[i];
        if (i < vals.length) {
          result += this._renderRuneTsHtmlObject(vals[i], isSSR); // 재귀 호출
        }
      }
      return result;
    } else if (Array.isArray(item)) {
      // console.log(`[_renderRuneTsHtmlObject] Processing Array: length ${item.length}`);
      return item
        .map((subItem) => this._renderRuneTsHtmlObject(subItem, isSSR))
        .join("");
    } else if (item instanceof View) {
      // console.log(`[_renderRuneTsHtmlObject] Processing View: ${item.constructor.name}`);
      return item.toHtml(isSSR);
    } else if (item !== null && item !== undefined) {
      // console.log(`[_renderRuneTsHtmlObject] Processing other (String()): ${typeof item}, value: ${String(item).substring(0,100)}`);
      return String(item); // 일반 값 또는 이미 문자열화된 "[object Object]"
    }
    return ""; // null 또는 undefined의 경우 빈 문자열 반환
  }

  private _documentAddRuneAttrs(isSSR: boolean): string {
    const attrs = [];
    attrs.push(`data-rune-view="${this.constructor.name}"`);
    if (this.key) {
      attrs.push(`data-rune-key="${this.key}"`);
    }

    if (isSSR) {
      // 'children'을 제외한 props만 직렬화하여 순환 참조 방지
      const { children, ...propsToSerialize } = this.data; // Use this.data consistently
      try {
        const propsString = JSON.stringify(propsToSerialize);
        attrs.push(`data-rune-props='${propsString}'`);
      } catch (error) {
        console.error(
          `Error serializing props for ${this.constructor.name} in _addRuneAttrs:`,
          error,
        );
        // 에러 발생 시 빈 props 문자열 또는 다른 대체 값 사용 가능
        attrs.push(`data-rune-props='{}'`);
      }
    }
    return attrs.join(" ");
  }

  /**
   * 메타 태그 렌더링
   */
  protected renderMetaTags(metadata: DocumentProps["metadata"]): RuneHtml {
    // Html 타입을 RuneHtml로 변경합니다.
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
  protected renderStyles(): RuneHtml {
    // Html 타입을 RuneHtml로 변경합니다.
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
  protected renderHeadContent(): RuneHtml {
    // Html 타입을 RuneHtml로 변경합니다.
    return html``;
  }

  /**
   * body 시작 부분 (오버라이드 가능)
   */
  protected renderBodyStart(): RuneHtml {
    // Html 타입을 RuneHtml로 변경합니다.
    return html``;
  }

  /**
   * body 끝 부분 (오버라이드 가능)
   */
  protected renderBodyEnd(): RuneHtml {
    // Html 타입을 RuneHtml로 변경합니다.
    return html``;
  }
}
