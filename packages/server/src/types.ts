import { Request, Response, NextFunction } from "express";
import { View } from "rune-ts";

export interface RuneServerOptions {
  port?: number;
  dev?: boolean;
  pagesDir?: string;
  apiDir?: string;
  publicDir?: string;
  buildDir?: string;
  clientAssetsPrefix?: string; // clientAssetsPrefix 추가
  hotReloadPort?: number;
}

export interface RunePageProps {
  params?: Record<string, string>;
  query?: Record<string, string>;
  pathname?: string;
}

export type RuneMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export type ApiHandler = (req: Request, res: Response) => void | Promise<void>;

export interface ApiModule {
  GET?: ApiHandler;
  POST?: ApiHandler;
  PUT?: ApiHandler;
  DELETE?: ApiHandler;
  PATCH?: ApiHandler;
  OPTIONS?: ApiHandler;
  HEAD?: ApiHandler;
  default?: ApiHandler;
}

export interface PageModule {
  default: new (props: any) => View<any>;
  // getServerSideProps는 이제 인스턴스 메서드이므로 여기서 제거
}

export interface Route {
  path: string;
  filePath: string;
  isDynamic: boolean;
  params: string[];
}
