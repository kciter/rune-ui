import type { StorybookConfig } from "@storybook/html-vite";
import { runeJsxVitePlugin } from "@rune-ui/jsx";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-interactions"],
  framework: {
    name: "@storybook/html-vite",
    options: {},
  },
  viteFinal: (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(runeJsxVitePlugin());
    return config;
  },
};
export default config;
