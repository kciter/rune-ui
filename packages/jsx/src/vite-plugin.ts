import type { Plugin } from "vite";

export function runeJsxVitePlugin(
  options: {
    jsxFactory?: string;
    jsxFragmentFactory?: string;
    importPath?: string;
  } = {}
): Plugin {
  const factory = options.jsxFactory ?? "createHtml";
  const fragment = options.jsxFragmentFactory ?? "Fragment";
  const importPath = options.importPath ?? "@rune-ui/jsx";

  return {
    name: "rune-jsx-vite-plugin",
    enforce: "pre",
    async transform(code, id) {
      if (!id.match(/\.(tsx|jsx)$/)) return;
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
        code: importStmt + jsxPragma + fragPragma + code,
        map: null,
      };
    },
  };
}
