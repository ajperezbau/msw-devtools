import { createApp, h, type Plugin } from "vue";
import MswDevtools from "./mswDevtools.vue";

export * from "./mswRegistry";
export { MswDevtools };

export const MswDevtoolsPlugin: Plugin = {
  install() {
    if (typeof window === "undefined") return;

    if (document.getElementById("msw-devtools-plugin-root")) return;

    const container = document.createElement("div");
    container.id = "msw-devtools-plugin-root";
    document.body.appendChild(container);

    const devtoolsApp = createApp({
      render: () => h(MswDevtools),
    });

    devtoolsApp.mount(container);
  },
};
