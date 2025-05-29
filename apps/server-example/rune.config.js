/**
 * Rune UI Configuration
 * @type {import('@rune-ui/server').RuneConfig}
 */
export default {
  // 서버 설정
  server: {
    port: 3000,
    host: "localhost",
    hotReloadPort: 3001,
    hotReload: true, // Hot reload 활성화/비활성화
  },

  // 디렉토리 설정
  dirs: {
    pages: "src/pages",
    api: "src/api",
    public: "public",
    build: ".rune",
  },

  // 정적 자산 설정
  assets: {
    prefix: "/assets",
  },

  // 미들웨어 설정
  middleware: [
    // 내장 미들웨어
    "cors",
    "logging",
    "security",

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
  },
};
