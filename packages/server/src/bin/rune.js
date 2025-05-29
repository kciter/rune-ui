#!/usr/bin/env tsx
import { Command } from "commander";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json");

// SWC register 설정
function setupTransform() {
  try {
    require("@swc/register")({
      jsc: {
        target: "es2019",
        parser: {
          syntax: "typescript",
          tsx: true,
          decorators: false,
          dynamicImport: false,
        },
        transform: {
          react: {
            pragma: "h",
            pragmaFrag: "Fragment",
            throwIfNamespace: false,
            development: false,
            useBuiltins: false,
          },
        },
      },
      module: {
        type: "commonjs",
      },
    });
  } catch (error) {
    process.exit(1);
  }
}

const program = new Command();

program
  .name("rune-dev")
  .description("Rune UI development server")
  .version(packageJson.version);

// dev 명령어
program
  .command("dev")
  .description("Start development server")
  .option("-p, --port <port>", "Port number", "3000")
  .option("--pages <dir>", "Pages directory", "src/pages")
  .option("--api <dir>", "API directory", "src/api")
  .option("--public <dir>", "Public directory", "public")
  .option("--build <dir>", "Build directory", ".rune")
  .option("--host <host>", "Host address", "localhost")
  .option("--hot-reload-port <port>", "Hot reload WebSocket port", "3001")
  .option("--no-hot-reload", "Disable hot reload")
  .option("-c, --config <path>", "Path to config file")
  .option("--no-config", "Disable config file loading")
  .action(async (options) => {
    setupTransform();

    try {
      // .js 확장자 추가하고 await 사용
      const { startDevServer } = await import("../dev/dev-server.js");

      // hot reload 옵션 처리
      const hotReloadPort =
        options.hotReload !== false
          ? parseInt(options.hotReloadPort)
          : undefined;

      await startDevServer({
        port: parseInt(options.port),
        host: options.host,
        pagesDir: path.resolve(process.cwd(), options.pages),
        apiDir: path.resolve(process.cwd(), options.api),
        publicDir: path.resolve(process.cwd(), options.public),
        buildDir: path.resolve(process.cwd(), options.build),
        hotReloadPort,
        configPath: options.config,
        disableConfig: options.noConfig,
        dev: true,
      });
    } catch (error) {
      console.error("❌ Failed to start dev server:", error);
      process.exit(1);
    }
  });

// build 명령어
program
  .command("build")
  .description("Build for production")
  .option("-o, --output <dir>", "Output directory", "dist")
  .option("--pages <dir>", "Pages directory", "src/pages")
  .option("--api <dir>", "API directory", "src/api")
  .option("--public <dir>", "Public directory", "public")
  .option("--build <dir>", "Build directory", ".rune")
  .option("-c, --config <path>", "Path to config file")
  .option("--no-config", "Disable config file loading")
  .action(async (options) => {
    setupTransform();

    const { buildApp } = await import("../build/builder");

    await buildApp({
      outputDir: path.resolve(process.cwd(), options.output),
      pagesDir: path.resolve(process.cwd(), options.pages),
      apiDir: path.resolve(process.cwd(), options.api),
      publicDir: path.resolve(process.cwd(), options.public),
      buildDir: path.resolve(process.cwd(), options.build),
      configPath: options.config,
      disableConfig: options.noConfig,
    });
  });

// start 명령어 (프로덕션)
program
  .command("start")
  .description("Start production server")
  .option("-p, --port <port>", "Port number", "3000")
  .option("--host <host>", "Host address", "0.0.0.0")
  .option("-d, --dir <dir>", "Build directory", "dist")
  .action(async (options) => {
    const { startProdServer } = await import("../prod/prod-server");

    startProdServer({
      port: parseInt(options.port),
      host: options.host,
      buildDir: path.resolve(process.cwd(), options.dir),
    });
  });

// create 명령어 (프로젝트 생성)
program
  .command("create <name>")
  .description("Create a new Rune UI project")
  .option("-t, --template <template>", "Template to use", "basic")
  .action(async (name, options) => {
    const { createProject } = await import("../create/creator");

    await createProject(name, {
      template: options.template,
      targetDir: path.resolve(process.cwd(), name),
    });
  });

// init 명령어 (기존 프로젝트에 Rune UI 추가)
program
  .command("init")
  .description("Initialize Rune UI in existing project")
  .option("-f, --force", "Force initialization")
  .action(async (options) => {
    const { initProject } = await import("../create/init");

    await initProject({
      targetDir: process.cwd(),
      force: options.force,
    });
  });

program.parse();
