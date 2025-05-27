import type { Request, Response } from "express";
import type { ApiModule, ApiHandler } from "../types";

export function createApiHandler(module: ApiModule): ApiHandler {
  return async (req: Request, res: Response) => {
    const method = req.method.toUpperCase() as keyof ApiModule;

    // HTTP 메서드에 해당하는 핸들러 찾기
    let handler = module[method];

    // 메서드별 핸들러가 없으면 default 핸들러 사용
    if (!handler && module.default) {
      handler = module.default;
    }

    if (!handler) {
      res.status(405).json({
        error: "Method Not Allowed",
        message: `${method} method is not supported for this endpoint`,
      });
      return;
    }

    try {
      await handler(req, res);
    } catch (error) {
      console.error("API handler error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };
}

/**
 * API 라우트에서 사용할 수 있는 유틸리티 함수들
 */
export const apiUtils = {
  /**
   * JSON 응답 전송
   */
  json: (res: Response, data: any, status: number = 200) => {
    res.status(status).json(data);
  },

  /**
   * 에러 응답 전송
   */
  error: (res: Response, message: string, status: number = 400) => {
    res.status(status).json({ error: message });
  },

  /**
   * 성공 응답 전송
   */
  success: (res: Response, data?: any, message?: string) => {
    res.json({ success: true, message, data });
  },

  /**
   * 요청 본문 파싱 (express.json() 미들웨어 대체)
   */
  parseBody: async (req: Request): Promise<any> => {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(new Error("Invalid JSON"));
        }
      });
    });
  },
};
