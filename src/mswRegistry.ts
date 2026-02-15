import {
  http,
  HttpResponse,
  type DefaultBodyType,
  type HttpResponseResolver,
  type HttpHandler,
} from "msw";
import { reactive, ref, watch } from "vue";
import type {
  VueDevtoolsConfig,
  CustomOverride,
  CustomScenario,
  HandlerMetadata,
  LogEntry,
  Preset,
} from "./types";

declare module "msw" {
  interface HttpHandler {
    __vueDevtoolsConfig?: VueDevtoolsConfig;
  }
}

const STORAGE_KEY = "msw-scenarios";
const DELAY_KEY = "msw-delay";
const HANDLER_DELAY_KEY = "msw-handler-delays";
const OVERRIDES_KEY = "msw-overrides";
const CUSTOM_SCENARIOS_KEY = "msw-custom-scenarios";
const CUSTOM_PRESETS_KEY = "msw-custom-presets";

const getPersistedScenarios = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const getPersistedHandlerDelays = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(HANDLER_DELAY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const getPersistedOverrides = (): Record<string, CustomOverride> => {
  try {
    const stored = localStorage.getItem(OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const getPersistedCustomScenarios = (): Record<
  string,
  Record<string, CustomScenario>
> => {
  try {
    const stored = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const getPersistedCustomPresets = (): Preset[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const scenarioState = reactive<Record<string, string>>(
  getPersistedScenarios(),
);
export const handlerDelays = reactive<Record<string, number>>(
  getPersistedHandlerDelays(),
);
export const customOverrides = reactive<Record<string, CustomOverride>>(
  getPersistedOverrides(),
);
export const customScenarios = reactive<
  Record<string, Record<string, CustomScenario>>
>(getPersistedCustomScenarios());
export const customPresets = reactive<Preset[]>(getPersistedCustomPresets());
export const globalDelay = ref(Number(localStorage.getItem(DELAY_KEY)) || 0);

export const scenarioRegistry = reactive<Record<string, HandlerMetadata>>({});
export const activityLog = reactive<LogEntry[]>([]);
export const presets = reactive<Preset[]>([]);

export const displayKey = (key: string) => {
  // Strip [METHOD] prefix from native handlers
  return key.replace(/^\[[A-Z]+\]\s+/, "");
};

interface RegisteredHandler {
  key: string;
  factory: (resolver: (url: string) => string) => any;
  priority: number;
}

let mswInstance: { resetHandlers: (...handlers: any[]) => void } | null = null;
const registeredHandlers: RegisteredHandler[] = [];
let baseHandlers: any[] = [];
let urlResolver: (url: string) => string = (url) => url;

const BUILT_IN_SCENARIOS: Record<string, HttpResponseResolver> = {
  ServerError: () => new HttpResponse(null, { status: 500 }),
};

const refreshHandlers = () => {
  if (!mswInstance) return;

  // Sort by priority (higher first). MSW matches in order of provided handlers.
  const sorted = [...registeredHandlers].sort(
    (a, b) => b.priority - a.priority,
  );
  const handlers = sorted.map((h) => h.factory(urlResolver));
  mswInstance.resetHandlers(...handlers, ...baseHandlers);
};

const registerInternal = (config: {
  key: string;
  url: string;
  method: "get" | "post" | "put" | "delete" | "patch";
  scenarios: Record<string, HttpResponseResolver>;
  defaultScenario?: string;
  priority?: number;
  isNative?: boolean;
}) => {
  const {
    key,
    url,
    method,
    scenarios: baseScenarios,
    defaultScenario = "default",
    priority = 0,
    isNative = false,
  } = config;

  const scenarios: Record<string, HttpResponseResolver> = {
    ...BUILT_IN_SCENARIOS,
    ...baseScenarios,
  };

  // If no "default" was explicitly provided in scenarios, but we have others,
  // pick the first one as default if defaultScenario is still "default"
  let effectiveDefault = defaultScenario;
  if (
    effectiveDefault === "default" &&
    !scenarios.default &&
    Object.keys(baseScenarios).length > 0
  ) {
    effectiveDefault = Object.keys(baseScenarios)[0]!;
  }

  const originalScenarios = Object.keys(scenarios);

  // Registrar metadatos
  scenarioRegistry[key] = {
    url,
    method: method.toUpperCase(),
    isNative,
    originalScenarios,
    scenarios: [
      ...originalScenarios,
      ...Object.keys(customScenarios[key] || {}),
    ].filter((v, i, a) => a.indexOf(v) === i), // Unificar y evitar duplicados
  };

  // Inicializar estado si no existe (URL tiene prioridad sobre persistencia)
  const urlParams = new URLSearchParams(window.location.search);
  const urlValue = urlParams.get(key);

  if (urlValue) {
    scenarioState[key] = urlValue;
  } else if (!scenarioState[key]) {
    scenarioState[key] = effectiveDefault;
  }

  // Inicializar delay si no existe
  if (handlerDelays[key] === undefined) {
    handlerDelays[key] = 0;
  }

  const factory = (resolver: (url: string) => string) =>
    http[method](resolver(url), async (info: any) => {
      const { request, params } = info;

      // Capture request body (cloning to avoid consuming the stream)
      let requestBody: unknown;
      try {
        const clonedRequest = request.clone();
        const contentType = clonedRequest.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          requestBody = await clonedRequest.json();
        } else {
          const text = await clonedRequest.text();
          requestBody = text || undefined;
        }
      } catch {
        requestBody = undefined;
      }

      const currentUrlParams = new URLSearchParams(window.location.search);
      const activeScenarioKey =
        currentUrlParams.get(key) || scenarioState[key] || effectiveDefault;

      const override = customOverrides[key];

      let response: HttpResponse<DefaultBodyType> | undefined;

      if (override?.enabled) {
        try {
          const body = JSON.parse(override.body);
          response = HttpResponse.json(body, { status: override.status });
        } catch {
          response = new HttpResponse(override.body, {
            status: override.status,
            headers: { "Content-Type": "text/plain" },
          });
        }
      }

      if (!response) {
        const customScenario = customScenarios[key]?.[activeScenarioKey];

        if (customScenario) {
          try {
            const body = JSON.parse(customScenario.body);
            response = HttpResponse.json(body, {
              status: customScenario.status,
            });
          } catch {
            response = new HttpResponse(customScenario.body, {
              status: customScenario.status,
              headers: { "Content-Type": "text/plain" },
            });
          }
        } else {
          let resolver = scenarios[activeScenarioKey];

          // Fallback to default scenario if active one doesn't exist
          if (!resolver && activeScenarioKey !== effectiveDefault) {
            resolver = scenarios[effectiveDefault];
          }

          // Final fallback to any available scenario if default one also doesn't exist
          if (!resolver) {
            const firstAvailableKey = Object.keys(scenarios)[0];
            if (firstAvailableKey) {
              resolver = scenarios[firstAvailableKey];
            }
          }

          if (!resolver) {
            // eslint-disable-next-line no-console
            console.warn(
              `[MswRegistry] Escenario '${activeScenarioKey}' no encontrado para '${key}'`,
            );
            response = new HttpResponse(null, { status: 404 });
          } else {
            response = (await resolver(info)) as HttpResponse<DefaultBodyType>;
          }
        }
      }

      const activeDelay =
        (handlerDelays[key] ?? 0) > 0 ? handlerDelays[key] : globalDelay.value;
      if (activeDelay && activeDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, activeDelay));
      }

      if (response instanceof HttpResponse) {
        // Capture response body (cloning to avoid consuming the stream)
        let responseBody: unknown;
        try {
          const clonedResponse = response.clone();
          const contentType = clonedResponse.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            responseBody = await clonedResponse.json();
          } else {
            const text = await clonedResponse.text();
            responseBody = text || undefined;
          }
        } catch {
          responseBody = undefined;
        }

        // Capture headers
        const headers: Record<string, string> = {};
        request.headers.forEach((value: string, key: string) => {
          headers[key] = value;
        });

        // Capture query parameters
        const urlObj = new URL(request.url);
        const queryParams: Record<string, string> = {};
        urlObj.searchParams.forEach((value: string, key: string) => {
          queryParams[key] = value;
        });

        activityLog.unshift({
          id: Math.random().toString(36).substring(2),
          timestamp: Date.now(),
          key,
          scenario: override?.enabled ? "Manual Override" : activeScenarioKey,
          method: method.toUpperCase(),
          url: request.url,
          status: response.status,
          requestBody,
          responseBody,
          headers,
          queryParams,
          pathParams: params as Record<string, string>,
        });

        if (activityLog.length > 100) {
          activityLog.pop();
        }
      }

      return response;
    });

  // Registrar en el listado global
  registeredHandlers.push({ key, factory, priority });

  // Si ya tenemos instancia de MSW, refrescar
  if (mswInstance) {
    refreshHandlers();
  }

  return factory(urlResolver);
};

export const setupMswRegistry = (
  instance: any,
  initialHandlers: any[] = [],
  resolver?: (url: string) => string,
) => {
  mswInstance = instance;
  if (resolver) urlResolver = resolver;

  // Auto-discover handlers already present in MSW
  if (typeof instance.listHandlers === "function") {
    const existingHandlers = instance.listHandlers();

    // If no initial handlers provided, we capture everything that we won't be managing
    if (initialHandlers.length === 0) {
      baseHandlers = existingHandlers.filter((handler: any) => {
        // If it has __vueDevtoolsConfig, it's explicitly managed by devtools
        if (handler.__vueDevtoolsConfig) return false;

        // If it doesn't have enough info to be auto-discovered, it belongs to baseHandlers
        if (
          !handler.info ||
          typeof handler.info.path !== "string" ||
          typeof handler.info.method !== "string"
        ) {
          return true;
        }

        // Only support standard HTTP methods for auto-discovery
        const methodLower = handler.info.method.toLowerCase();
        const supportedMethods = ["get", "post", "put", "delete", "patch"];
        if (!supportedMethods.includes(methodLower)) {
          return true;
        }

        return false; // This handler WILL be auto-discovered (or is already managed)
      });
    } else {
      baseHandlers = initialHandlers;
    }

    existingHandlers.forEach((handler: any) => {
      // Check if this handler has devtools configuration
      if (handler.__vueDevtoolsConfig) {
        const config = handler.__vueDevtoolsConfig;
        registerInternal({
          key: config.key,
          url: config.url,
          method: config.method,
          scenarios: config.scenarios,
          defaultScenario: config.defaultScenario,
          priority: config.priority,
          isNative: config.isNative,
        });
        return;
      }

      // Small check to avoid internal or already managed handlers
      if (
        !handler.info ||
        typeof handler.info.path !== "string" ||
        typeof handler.info.method !== "string"
      ) {
        return;
      }

      const { path, method } = handler.info;
      const methodUpper = method.toUpperCase();
      const methodLower = method.toLowerCase();

      // Only support standard HTTP methods for auto-discovery
      const supportedMethods = ["get", "post", "put", "delete", "patch"];
      if (!supportedMethods.includes(methodLower)) return;

      // Check if already managed by url+method combination
      const isAlreadyManaged = Object.values(scenarioRegistry).some(
        (m) => m.url === path && m.method === methodUpper,
      );

      if (!isAlreadyManaged) {
        // Use a composite key [METHOD] path for native handlers to avoid collisions
        const key = `[${methodUpper}] ${path}`;
        registerInternal({
          key,
          url: path,
          method: methodLower as any,
          isNative: true,
          scenarios: {
            original: handler.resolver || handler.run,
          },
          defaultScenario: "original",
        });
      }
    });
  }

  refreshHandlers();
};

export const clearActivityLog = () => {
  activityLog.length = 0;
};

export const registerPreset = (preset: Preset) => {
  const index = presets.findIndex((p) => p.name === preset.name);
  if (index !== -1) {
    presets[index] = preset;
  } else {
    presets.push(preset);
  }
};

export const definePresets = (newPresets: Preset[]) => {
  newPresets.forEach(registerPreset);
};

export const applyPreset = (presetName: string) => {
  const allPresets = [...presets, ...customPresets];
  const preset = allPresets.find((p) => p.name === presetName);
  if (preset) {
    Object.entries(preset.scenarios).forEach(([key, scenario]) => {
      // Solo aplicar si el handler existe
      if (scenarioRegistry[key]) {
        scenarioState[key] = scenario;
      }
    });
  }
};

// Persistir cambios en localStorage
watch(
  scenarioState,
  (newState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  },
  { deep: true },
);

watch(
  handlerDelays,
  (newDelays) => {
    localStorage.setItem(HANDLER_DELAY_KEY, JSON.stringify(newDelays));
  },
  { deep: true },
);

watch(
  customOverrides,
  (newOverrides) => {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(newOverrides));
  },
  { deep: true },
);

watch(
  customScenarios,
  (newScenarios) => {
    localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(newScenarios));
  },
  { deep: true },
);

watch(
  customPresets,
  (newPresets) => {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(newPresets));
  },
  { deep: true },
);

watch(globalDelay, (newDelay) => {
  localStorage.setItem(DELAY_KEY, String(newDelay));
});

/**
 * Define MSW handlers with multiple scenarios for the devtools.
 *
 * @param configs - Object mapping handler keys to their configuration
 * @returns Array of MSW HttpHandler instances with attached devtools metadata
 *
 * @example
 * ```typescript
 * const handlers = defineHandlers({
 *   users: {
 *     url: "/api/users",
 *     method: "get",
 *     scenarios: {
 *       success: () => HttpResponse.json([{ id: 1, name: "John" }]),
 *       empty: () => HttpResponse.json([]),
 *     },
 *   },
 * });
 *
 * // Pass handlers to MSW worker
 * const worker = setupWorker(...handlers);
 * await worker.start();
 *
 * // Then initialize the devtools plugin
 * app.use(MswDevtoolsPlugin, { worker });
 * ```
 *
 * @remarks
 * The returned handlers must be passed to setupWorker() and the worker must be
 * provided to MswDevtoolsPlugin for the devtools functionality to work.
 * Until setupMswRegistry() is called (which happens automatically when the plugin
 * is installed), handlers will return a simple 200 OK response.
 */
export const defineHandlers = (
  configs: Record<
    string,
    {
      url: string;
      method?: "get" | "post" | "put" | "patch" | "delete";
      scenarios: Record<string, HttpResponseResolver>;
      defaultScenario?: string;
      priority?: number;
    }
  >,
): HttpHandler[] => {
  return Object.entries(configs).map(([key, config]) => {
    const method = (config.method || "get") as
      | "get"
      | "post"
      | "put"
      | "patch"
      | "delete";
    const defaultScenario = config.defaultScenario || "default";
    const priority = config.priority || 0;

    // Create a basic MSW handler with a placeholder resolver.
    // IMPORTANT: These handlers must be passed to setupWorker() and then
    // setupMswRegistry() must be called to activate the devtools functionality.
    // Until setupMswRegistry() is called, handlers will return a simple 200 response.
    // After setupMswRegistry() processes them, they will use the actual scenario resolvers.
    const handler = http[method](config.url, () => {
      return new HttpResponse(null, { status: 200 });
    }) as HttpHandler;

    // Attach devtools metadata to the handler for later processing by setupMswRegistry
    handler.__vueDevtoolsConfig = {
      key,
      url: config.url,
      method,
      scenarios: config.scenarios,
      defaultScenario,
      priority,
      isNative: false,
    };

    return handler;
  });
};
