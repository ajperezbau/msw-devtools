import { defineCustomElement } from "vue";
import MswDevtools from "./mswDevtools.ce.vue";
import { setupMswRegistry } from "./mswRegistry";
import type { MswDevtoolsOptions } from "./types";

export * from "./mswRegistry";

let MswDevtoolsElement: ReturnType<typeof defineCustomElement> | null = null;

export function initMswDevtools(options: MswDevtoolsOptions): void {
  if (typeof window === "undefined") return;

  if (!options?.worker) {
    console.error(
      "[MswDevtools] A MSW worker instance is required. " +
        "Pass it via: initMswDevtools({ worker })",
    );
    return;
  }

  setupMswRegistry(options.worker, options.urlResolver, {
    initialScenarioMode: options.initialScenarioMode,
    persistence: options.persistence,
    initialShowToggle: options.initialShowToggle,
  });

  if (!MswDevtoolsElement) {
    MswDevtoolsElement = defineCustomElement(MswDevtools);
  }

  if (!customElements.get("msw-devtools")) {
    customElements.define("msw-devtools", MswDevtoolsElement!);
  }

  if (!document.querySelector("msw-devtools")) {
    document.body.appendChild(document.createElement("msw-devtools"));
  }
}
