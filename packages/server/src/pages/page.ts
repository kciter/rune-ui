import { Html, View } from "rune-ts";
import type { RunePageProps } from "../types";
import { Document } from "./document";

export interface PageMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  [key: string]: any;
}

export abstract class RunePage<
  T extends object = RunePageProps,
> extends View<T> {
  /**
   * 서버 사이드에서 데이터를 가져오는 메서드
   */
  static async getServerSideProps?(context: {
    params?: Record<string, string>;
    query?: Record<string, string>;
    req: any;
    res: any;
  }): Promise<{ props: any }>;

  /**
   * 페이지 메타데이터 (SEO)
   */
  static getMetadata?(): PageMetadata;

  /**
   * 사용할 Document 클래스 지정
   */
  static getDocument?(): typeof Document;

  /**
   * 클라이언트 스크립트 (선택적)
   */
  getClientScript?(): string;

  /**
   * 페이지 컨텐츠 렌더링 (추상 메서드)
   */
  abstract template(): Html;
}
