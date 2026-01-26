import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MswDevtoolsPlugin",
      fileName: "msw-devtools",
    },
    rollupOptions: {
      external: ["vue", "msw"],
      output: {
        globals: {
          vue: "Vue",
          msw: "MSW",
        },
      },
    },
  },
});
