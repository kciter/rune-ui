/**
 * 커스텀 로깅 미들웨어 예제
 * @param {Object} options - 미들웨어 옵션
 * @returns {Function} Express 미들웨어 함수
 */
export default function customLoggingMiddleware(options = {}) {
  const {
    logLevel = "info",
    includeHeaders = false,
    excludePaths = ["/health", "/favicon.ico"],
  } = options;

  return (req, res, next) => {
    // 제외할 경로 체크
    if (excludePaths.includes(req.path)) {
      return next();
    }

    const start = Date.now();

    // 응답 완료 시 로그 출력
    res.on("finish", () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get("User-Agent"),
        ip: req.ip || req.connection.remoteAddress,
      };

      if (includeHeaders) {
        logData.headers = req.headers;
      }

      const logMessage = `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`;

      if (res.statusCode >= 400) {
        console.error("❌", logMessage, logData);
      } else if (logLevel === "debug") {
        console.debug("🔍", logMessage, logData);
      } else {
        console.log("📝", logMessage);
      }
    });

    next();
  };
}
