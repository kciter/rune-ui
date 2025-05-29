/**
 * 커스텀 인증 미들웨어 예제
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export default function authMiddleware(req, res, next) {
  // 인증이 필요한 경로 정의
  const protectedPaths = ["/admin", "/dashboard"];

  const isProtected = protectedPaths.some((path) => req.path.startsWith(path));

  if (isProtected) {
    // 간단한 토큰 기반 인증 예제
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized: No token provided",
      });
    }

    // 실제 프로젝트에서는 JWT 검증 등을 수행
    if (token !== "valid-token") {
      return res.status(401).json({
        error: "Unauthorized: Invalid token",
      });
    }

    // 사용자 정보를 요청 객체에 추가
    req.user = { id: 1, name: "Admin User" };
  }

  next();
}
