import type { Plugin } from "esbuild";

export function runeJsxEsbuildPlugin(
  options: {
    jsxFactory?: string;
    jsxFragmentFactory?: string;
    importPath?: string;
  } = {}
): Plugin {
  const factory = options.jsxFactory ?? "createHtml";
  const fragment = options.jsxFragmentFactory ?? "Fragment";
  const importPath = options.importPath ?? "@rune-ui/jsx/createHtml";

  return {
    name: "rune-jsx-esbuild-plugin",
    setup(build: any) {
      build.onLoad({ filter: /\.(tsx|jsx)$/ }, async (args: any) => {
        let code = await require("fs/promises").readFile(args.path, "utf8");
        if (code.includes("/** @jsx") || code.includes("@jsxRuntime")) return;

        const jsxPragma = `/** @jsx ${factory} */\n`;
        const fragPragma = `/** @jsxFrag ${fragment} */\n`;

        const alreadyHasImport = new RegExp(
          `import\\s+\\{\\s*${factory}\\s*\\}\\s+from`
        ).test(code);
        const importStmt = alreadyHasImport
          ? ""
          : `import { ${factory} } from '${importPath}';\n`;

        return {
          contents: importStmt + jsxPragma + fragPragma + code,
          loader: args.path.endsWith(".tsx") ? "tsx" : "jsx",
        };
      });
    },
  };
}
