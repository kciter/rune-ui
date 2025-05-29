import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CreateProjectOptions {
  template: string;
  targetDir: string;
}

export async function createProject(
  name: string,
  options: CreateProjectOptions,
) {
  const { targetDir, template } = options;

  console.log(chalk.blue(`🎯 Creating Rune UI project: ${name}`));

  // 디렉토리 생성
  await fs.ensureDir(targetDir);

  // 템플릿 파일들 복사
  await copyTemplate(template, targetDir);

  // package.json 생성
  await createPackageJson(name, targetDir);

  // 기본 파일들 생성
  await createBaseFiles(targetDir, name);

  console.log(chalk.green("✅ Project created successfully!"));
  console.log(chalk.cyan("\nNext steps:"));
  console.log(chalk.white(`  cd ${name}`));
  console.log(chalk.white("  npm install"));
  console.log(chalk.white("  npm run dev"));
}

async function copyTemplate(template: string, targetDir: string) {
  const templatesDir = path.join(__dirname, "../../templates");
  const templateDir = path.join(templatesDir, template);

  if (!(await fs.pathExists(templateDir))) {
    throw new Error(`Template "${template}" not found`);
  }

  await fs.copy(templateDir, targetDir);
}

async function createPackageJson(name: string, targetDir: string) {
  const packageJson = {
    name,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "rune-dev dev",
      build: "rune-dev build",
      start: "rune-dev start",
      lint: "eslint src --ext .ts,.tsx",
      "type-check": "tsc --noEmit",
    },
    dependencies: {
      "@rune-ui/server": "^0.1.0",
      "@rune-ui/jsx": "^0.1.0",
      "rune-ts": "^0.9.3",
    },
    devDependencies: {
      "@types/node": "^22.15.21",
      "@swc/core": "^1.3.0",
      "@swc/register": "^0.1.10",
      typescript: "^5.8.3",
      eslint: "^8.0.0",
      "@typescript-eslint/eslint-plugin": "^6.0.0",
      "@typescript-eslint/parser": "^6.0.0",
    },
  };

  await fs.writeFile(
    path.join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
}

async function createBaseFiles(targetDir: string, name: string) {
  // tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "ES2019",
      lib: ["ES2019", "DOM"],
      allowJs: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      moduleResolution: "node",
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react",
      jsxFactory: "h",
      jsxFragmentFactory: "Fragment",
    },
    include: ["src"],
    exclude: ["node_modules", "dist"],
  };

  await fs.writeFile(
    path.join(targetDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2),
  );

  // .gitignore
  const gitignore = `
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
`.trim();

  await fs.writeFile(path.join(targetDir, ".gitignore"), gitignore);

  // README.md
  const readme = `
# ${name}

A Rune UI application.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run type-check\` - Run TypeScript type checking

## Project Structure

\`\`\`
src/
  pages/          # Page components
    index.tsx     # Home page (/)
  api/            # API routes
    hello.ts      # API endpoint (/api/hello)
public/           # Static files
\`\`\`
`.trim();

  await fs.writeFile(path.join(targetDir, "README.md"), readme);
}
