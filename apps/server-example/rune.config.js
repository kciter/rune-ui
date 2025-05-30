/**
 * Rune UI Configuration
 * @type {import('@rune-ui/server').RuneConfig}
 */
export default {
  // 서버 설정
  server: {
    port: 3000,
    host: "localhost",
    hotReload: true, // Hot reload 활성화/비활성화
  },

  // 디렉토리 설정
  dirs: {
    pages: "src/pages",
    api: "src/api",
    public: "src/public",
    build: ".rune",
  },

  // 정적 자산 설정
  assets: {
    prefix: "/__rune",
  },

  // 미들웨어 설정
  middleware: [
    "./middleware/custom-logging.js", // 커스텀 로깅 미들웨어
    "./middleware/auth.js",
    // {
    //   path: './middleware/custom.js',
    //   options: { key: 'value' }
    // }
  ],

  // 개발 환경 설정
  dev: {
    // 개발 환경에서만 적용되는 설정
    enableDebugLogs: true,
  },

  // 빌드 설정
  build: {
    // 빌드 관련 설정
    minify: true,
    sourcemap: true,

    // 클라이언트 번들에서 제외할 추가 패키지들
    external: [
      // 사용자 정의 external 패키지들
      // 예: "some-server-only-package"
    ],

    // 서버 전용 패키지들 (기본값에 추가로 제외할 패키지들)
    serverPackages: [
      // 프로젝트 특정 서버 패키지들
      // 기본적으로 express, fs, path 등은 이미 제외됨
    ],
  },
};
