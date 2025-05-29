import path from "path";
import fs from "fs-extra";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export interface RuneConfig {
  // 서버 설정
  server?: {
    port?: number;
    host?: string;
    hotReload?: boolean;
    hotReloadPort?: number;
  };

  // 디렉토리 설정
  dirs?: {
    pages?: string;
    api?: string;
    public?: string;
    build?: string;
  };

  // 클라이언트 에셋 설정
  assets?: {
    prefix?: string;
  };

  // 빌드 설정
  build?: {
    external?: string[];
    serverPackages?: string[];
    sourcemap?: boolean;
  };

  // 개발 모드 전용 설정
  dev?: {
    overlay?: boolean;
    open?: boolean;
  };

  // 사용자 정의 함수들
  middleware?: string[]; // 미들웨어 파일 경로들
}

const DEFAULT_CONFIG: RuneConfig = {
  server: {
    port: 3000,
    host: "localhost",
    hotReload: true,
    hotReloadPort: 10126,
  },
  dirs: {
    pages: "src/pages",
    api: "src/api",
    public: "public",
    build: "dist",
  },
  assets: {
    prefix: "/__rune",
  },
  build: {
    external: [],
    serverPackages: [
      // Node.js 웹 프레임워크
      "express",
      "koa",
      "fastify",
      "hapi",

      // Node.js 런타임 관련
      "fs",
      "fs-extra",
      "path",
      "os",
      "crypto",
      "stream",
      "util",
      "buffer",
      "events",
      "child_process",
      "cluster",
      "worker_threads",

      // 서버 사이드 라이브러리
      "chokidar",
      "ws",
      "cors",
      "helmet",
      "compression",
      "body-parser",
      "multer",
      "cookie-parser",
      "session",
      "passport",

      // 빌드/개발 도구
      "esbuild",
      "rollup",
      "webpack",
      "vite",
      "tsx",
      "ts-node",
      "nodemon",

      // 데이터베이스
      "mongoose",
      "sequelize",
      "prisma",
      "pg",
      "mysql",
      "redis",

      // 기타 서버 전용 패키지
      "@rune-ui/server",
    ],
    sourcemap: true,
  },
  dev: {
    overlay: true,
    open: false,
  },
  middleware: [],
};

export async function loadConfig(
  configDir: string = process.cwd(),
): Promise<RuneConfig> {
  const configFiles = [
    "rune.config.js",
    "rune.config.mjs",
    "rune.config.ts",
    "rune.config.json",
  ];

  for (const configFile of configFiles) {
    const configPath = path.join(configDir, configFile);

    if (await fs.pathExists(configPath)) {
      try {
        console.log(`📄 Loading config from: ${configFile}`);

        let userConfig: RuneConfig;

        if (configFile.endsWith(".json")) {
          // JSON 파일
          const content = await fs.readFile(configPath, "utf8");
          userConfig = JSON.parse(content);
        } else if (configFile.endsWith(".ts")) {
          // TypeScript 파일 (esbuild-register 필요)
          try {
            // TypeScript 설정 파일을 위한 등록
            require("esbuild-register/dist/node").register({
              extensions: [".ts"],
              format: "cjs",
            });

            const configModule = require(configPath);
            userConfig = configModule.default || configModule;
          } catch (error) {
            console.warn(
              `⚠️ Failed to load TypeScript config, falling back to JS: ${error}`,
            );
            continue;
          }
        } else {
          // JavaScript 파일
          const configModule = require(configPath);
          userConfig = configModule.default || configModule;
        }

        // 기본 설정과 사용자 설정 병합
        const mergedConfig = mergeConfig(DEFAULT_CONFIG, userConfig);

        console.log(`✅ Config loaded successfully`);
        return mergedConfig;
      } catch (error) {
        console.error(`❌ Error loading config from ${configFile}:`, error);
        continue;
      }
    }
  }

  console.log("📄 No config file found, using default configuration");
  return DEFAULT_CONFIG;
}

function mergeConfig(
  defaultConfig: RuneConfig,
  userConfig: RuneConfig,
): RuneConfig {
  return {
    server: { ...defaultConfig.server, ...userConfig.server },
    dirs: { ...defaultConfig.dirs, ...userConfig.dirs },
    assets: { ...defaultConfig.assets, ...userConfig.assets },
    build: {
      ...defaultConfig.build,
      ...userConfig.build,
      // 배열 필드는 합치기
      external: [
        ...(defaultConfig.build?.external || []),
        ...(userConfig.build?.external || []),
      ],
      serverPackages: [
        ...(defaultConfig.build?.serverPackages || []),
        ...(userConfig.build?.serverPackages || []),
      ],
    },
    dev: { ...defaultConfig.dev, ...userConfig.dev },
    middleware: [
      ...(defaultConfig.middleware || []),
      ...(userConfig.middleware || []),
    ],
  };
}

export function resolveConfigPaths(
  config: RuneConfig,
  rootDir: string = process.cwd(),
): RuneConfig {
  const resolvedConfig = { ...config };

  if (resolvedConfig.dirs) {
    resolvedConfig.dirs = {
      pages: resolvedConfig.dirs.pages
        ? path.resolve(rootDir, resolvedConfig.dirs.pages)
        : undefined,
      api: resolvedConfig.dirs.api
        ? path.resolve(rootDir, resolvedConfig.dirs.api)
        : undefined,
      public: resolvedConfig.dirs.public
        ? path.resolve(rootDir, resolvedConfig.dirs.public)
        : undefined,
      build: resolvedConfig.dirs.build
        ? path.resolve(rootDir, resolvedConfig.dirs.build)
        : undefined,
    };
  }

  if (resolvedConfig.middleware) {
    resolvedConfig.middleware = resolvedConfig.middleware.map(
      (middlewarePath) => path.resolve(rootDir, middlewarePath),
    );
  }

  return resolvedConfig;
}
