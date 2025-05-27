import type { Request, Response } from "express";
import type { PageModule, RunePageProps } from "../types";
import { RunePage } from "./page";

export class PageRenderer {
  constructor(private isDev: boolean = false) {}

  /**
   * 페이지를 서버 사이드 렌더링
   */
  async renderPage(
    PageComponent: new (props: any) => RunePage,
    props: RunePageProps,
    req: Request,
    res: Response,
  ): Promise<string> {
    try {
      // 서버 사이드 props 가져오기
      let serverProps = {};
      if ((PageComponent as any).getServerSideProps) {
        const result = await (PageComponent as any).getServerSideProps({
          params: props.params || {},
          query: props.query || {},
          req,
          res,
        });
        serverProps = result.props || {};
      }

      // 최종 props 합치기
      const finalProps = {
        ...props,
        ...serverProps,
      };

      // 페이지 인스턴스 생성 및 렌더링
      const pageInstance = new PageComponent(finalProps);
      return pageInstance.toHtml();
    } catch (error) {
      console.error("Page rendering error:", error);

      if (this.isDev) {
        // 개발 모드에서는 상세한 에러 정보 표시
        return this.renderErrorPage(error, props);
      } else {
        // 프로덕션에서는 간단한 에러 페이지
        return this.render404Page();
      }
    }
  }

  /**
   * 404 페이지 렌더링
   */
  private render404Page(): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>404 - Page Not Found</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
    }
    .error-container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 { color: #333; margin-bottom: 1rem; }
    p { color: #666; margin-bottom: 1.5rem; }
    a { color: #0070f3; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>404 - Page Not Found</h1>
    <p>요청한 페이지를 찾을 수 없습니다.</p>
    <a href="/">홈으로 돌아가기</a>
  </div>
</body>
</html>`;
  }

  /**
   * 개발 모드 에러 페이지 렌더링
   */
  private renderErrorPage(error: any, props: RunePageProps): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Server Error</title>
  <style>
    body {
      font-family: 'Monaco', 'Consolas', monospace;
      margin: 0;
      padding: 2rem;
      background-color: #1a1a1a;
      color: #fff;
      line-height: 1.6;
    }
    .error-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #ff6b6b;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .error-message {
      background: #2a2a2a;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      border-left: 4px solid #ff6b6b;
    }
    .error-stack {
      background: #1e1e1e;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.9rem;
      border: 1px solid #333;
    }
    .props-info {
      margin-top: 2rem;
      background: #2a2a2a;
      padding: 1rem;
      border-radius: 4px;
    }
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="error-container">
    <h1>🚨 Server Rendering Error</h1>

    <div class="error-message">
      <strong>Error:</strong> ${errorMessage}
    </div>

    ${
      errorStack
        ? `
    <div class="error-stack">
      <strong>Stack Trace:</strong>
      <pre>${errorStack}</pre>
    </div>
    `
        : ""
    }

    <div class="props-info">
      <strong>Page Props:</strong>
      <pre>${JSON.stringify(props, null, 2)}</pre>
    </div>
  </div>
</body>
</html>`;
  }
}
