import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({ customElement: true }),
    dts({
      insertTypesEntry: true,
      staticImport: true,
      tsconfigPath: "./tsconfig.app.json",
      include: ["src/**/*.ts", "src/**/*.vue"],
      exclude: ["src/main.ts"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "MswDevtools",
      fileName: "msw-devtools",
    },
    rollupOptions: {
      external: ["msw"],
      output: {
        globals: {
          msw: "MSW",
        },
      },
    },
  },
});
