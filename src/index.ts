import { createApp, h, type Plugin } from "vue";
import MswDevtools from "./mswDevtools.vue";
import { setupMswRegistry } from "./mswRegistry";
import type { MswDevtoolsOptions } from "./types";

export * from "./mswRegistry";
export { MswDevtools };

export const MswDevtoolsPlugin: Plugin<MswDevtoolsOptions> = {
  install(_app, options) {
    if (typeof window === "undefined") return;

    const opts = Array.isArray(options) ? options[0] : options;

    if (!opts?.worker) {
      console.error(
        "[MswDevtoolsPlugin] A MSW worker instance is required. " +
          "Pass it via: app.use(MswDevtoolsPlugin, { worker })",
      );
      return;
    }

    setupMswRegistry(opts.worker, opts.urlResolver);

    if (document.getElementById("msw-devtools-plugin-root")) return;

    // Create a Shadow Root to fully isolate devtools styles from the host app.
    // CSS styles won't leak in or out, preventing any conflicts.
    const container = document.createElement("div");
    container.id = "msw-devtools-plugin-root";
    document.body.appendChild(container);

    const devtoolsApp = createApp({
      render: () => h(MswDevtools),
    });

    // In production builds, vite-plugin-css-injected-by-js stores the CSS
    // string via injectCodeFunction. We inject it into the Shadow DOM root
    // for full style isolation.
    // In dev mode Vite injects styles via HMR into <head>, so the global
    // won't be set — we fall back to a normal mount (no isolation needed for dev).
    const cssCode = (globalThis as Record<string, unknown>)[
      "__MSW_DEVTOOLS_CSS__"
    ];
    if (typeof cssCode === "string") {
      const shadowRoot = container.attachShadow({ mode: "open" });
      const styleEl = document.createElement("style");
      styleEl.textContent = cssCode;
      shadowRoot.appendChild(styleEl);
      const mountPoint = document.createElement("div");
      shadowRoot.appendChild(mountPoint);
      devtoolsApp.mount(mountPoint);
    } else {
      devtoolsApp.mount(container);
    }

    console.warn(
      `[MswDevtoolsPlugin] This plugin is deprecated. Use @ajperezbau/msw-devtools (https://www.npmjs.com/package/@ajperezbau/msw-devtools) instead.
The new package is framework-agnostic and works exactly the same as this one.`,
    );
  },
};
