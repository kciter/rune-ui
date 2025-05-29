import type { Request, Response } from "express";
import type { PageModule, RunePageProps } from "../types";
import { RunePage } from "./page";
import { setSsrContext, getPropsStore } from "../ssr/ssr-context";
import { Document } from "./document";
import path from "path";

export class PageRenderer {
  constructor(
    private isDev: boolean = false,
    private pagesDir: string = "", // Added pagesDir
    public clientAssetsPrefix: string = "/assets", // Changed to public (or remove private)
  ) {}

  /**
   * 페이지를 서버 사이드 렌더링
   */
  async renderPage(
    PageComponent: PageModule["default"], // 타입을 PageModule['default']로 변경
    pageProps: any,
    route?: any, // 라우트 정보 추가
  ): Promise<string> {
    setSsrContext(true); // SSR 컨텍스트 시작
    try {
      const pageInstance = new PageComponent(pageProps);

      // 인스턴스 메서드에서 메타데이터 가져오기
      const metadata = (pageInstance as any).getMetadata?.() || {
        title: "Rune App",
        description: "",
      };
      const clientScript = (pageInstance as any).getClientScript?.() || "";
      const DocumentClass = (PageComponent as any).getDocument?.() || Document;

      // 페이지별 클라이언트 스크립트 경로 추가
      let pageClientScriptPath = "";
      if (route && route.filePath) {
        // 라우트 파일 경로에서 클라이언트 스크립트 이름 추출
        const relativePath = path.relative(this.pagesDir, route.filePath);
        const scriptName = relativePath
          .replace(/\.tsx?$/, "") // 확장자 제거
          .replace(/\\/g, "/"); // Windows 경로 정규화
        pageClientScriptPath = `${this.clientAssetsPrefix}/${scriptName}.js`;
      }

      const pageContent = (pageInstance as any).template(); // template() 사용

      // Props store 데이터를 Document로 전달하기 위해 Map을 Object로 변환
      const propsStore = getPropsStore();
      const propsStoreData = Object.fromEntries(propsStore);

      const documentData = {
        metadata: metadata,
        children: pageContent,
        pageData: pageProps,
        clientScript: clientScript, // 사용자 정의 클라이언트 스크립트
        pageClientScriptPath: pageClientScriptPath, // 페이지별 자동 생성 스크립트
        propsStoreData: propsStoreData, // Props store 데이터 추가
      };

      const documentComponent = new DocumentClass(documentData);

      // documentComponent.toHtmlSSR().toString() 대신 오버라이드한 toHtml() 사용
      return documentComponent.toHtml(true); // isSSR = true 전달
    } finally {
      setSsrContext(false); // SSR 컨텍스트 해제
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
