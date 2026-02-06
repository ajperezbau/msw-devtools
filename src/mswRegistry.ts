import {
  http,
  HttpResponse,
  type DefaultBodyType,
  type HttpResponseResolver,
} from "msw";
import { reactive, ref, watch } from "vue";

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

interface CustomOverride {
  body: string;
  status: number;
  enabled: boolean;
}

const getPersistedOverrides = (): Record<string, CustomOverride> => {
  try {
    const stored = localStorage.getItem(OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

interface CustomScenario {
  body: string;
  status: number;
}

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

interface HandlerMetadata {
  url: string;
  method: string;
  scenarios: string[];
  originalScenarios: string[];
  isNative?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  key: string;
  scenario: string;
  method: string;
  url: string;
  status: number;
  responseBody?: unknown;
  requestBody?: unknown;
}

export const scenarioRegistry = reactive<Record<string, HandlerMetadata>>({});
export const activityLog = reactive<LogEntry[]>([]);

export interface Preset {
  name: string;
  description?: string;
  scenarios: Record<string, string>;
}

export const presets = reactive<Preset[]>([]);

interface RegisteredHandler {
  key: string;
  factory: (resolver: (url: string) => string) => any;
  priority: number;
}

let mswInstance: { resetHandlers: (...handlers: any[]) => void } | null = null;
const registeredHandlers: RegisteredHandler[] = [];
let baseHandlers: any[] = [];
let urlResolver: (url: string) => string = (url) => url;

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
      baseHandlers = existingHandlers.filter(
        (h: any) => !h.info || !h.info.path,
      );
    } else {
      baseHandlers = initialHandlers;
    }

    existingHandlers.forEach((handler: any) => {
      // Small check to avoid internal or already managed handlers
      if (!handler.info || !handler.info.path) return;

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
        register(key)
          .url(path)
          .method(methodLower as any)
          .native(true)
          .scenario("original", handler.resolver || handler.run)
          .defaultScenario("original")
          .build();
      }
    });
  }

  refreshHandlers();
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

const BUILT_IN_SCENARIOS: Record<string, HttpResponseResolver> = {
  ServerError: () => new HttpResponse(null, { status: 500 }),
};

type BuiltInScenario = keyof typeof BUILT_IN_SCENARIOS;

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
 * Fluent builder for MSW handlers
 */
export class MswHandlerBuilder<T extends string = "default"> {
  private _key: string;
  private _url: string = "";
  private _method: "get" | "post" | "put" | "delete" | "patch" = "get";
  private _scenarios: Record<string, HttpResponseResolver> = {
    ...BUILT_IN_SCENARIOS,
  };
  private _defaultScenario: string = "default";
  private _priority: number = 0;
  private _isNative: boolean = false;

  constructor(key: string) {
    this._key = key;
  }

  url(value: string) {
    this._url = value;
    return this;
  }

  native(value: boolean = true) {
    this._isNative = value;
    return this;
  }

  priority(value: number) {
    this._priority = value;
    return this;
  }

  method(value: "get" | "post" | "put" | "delete" | "patch") {
    this._method = value;
    return this;
  }

  defaultScenario(value: T | BuiltInScenario) {
    this._defaultScenario = value;
    return this;
  }

  scenario<S extends string>(
    name: S,
    resolver: HttpResponseResolver,
  ): MswHandlerBuilder<T | S> {
    const hadDefaultScenario = Boolean(this._scenarios.default);
    this._scenarios[name] = resolver;

    // If no default scenario was set and this isn't "default", make it the default
    if (
      this._defaultScenario === "default" &&
      name !== "default" &&
      !hadDefaultScenario
    ) {
      this._defaultScenario = name;
    }

    return this as unknown as MswHandlerBuilder<T | S>;
  }

  build() {
    const key = this._key;
    const url = this._url;
    const method = this._method;
    const scenarios = this._scenarios;
    const defaultScenario = this._defaultScenario;
    const priority = this._priority;
    const isNative = this._isNative;

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
      scenarioState[key] = defaultScenario;
    }

    // Inicializar delay si no existe
    if (handlerDelays[key] === undefined) {
      handlerDelays[key] = 0;
    }

    const factory = (resolver: (url: string) => string) =>
      http[method](resolver(url), async (info: any) => {
        const { request } = info;

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
          currentUrlParams.get(key) || scenarioState[key] || defaultScenario;

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
            if (!resolver && activeScenarioKey !== defaultScenario) {
              resolver = scenarios[defaultScenario];
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
              response = (await resolver(
                info,
              )) as HttpResponse<DefaultBodyType>;
            }
          }
        }

        const activeDelay =
          (handlerDelays[key] ?? 0) > 0
            ? handlerDelays[key]
            : globalDelay.value;
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
  }
}

export const register = (key: string) => new MswHandlerBuilder(key);

/**
 * @deprecated Use register(key).url(url).scenario(...).build() instead
 */
export const createOrchestratedHandler = <
  T extends string,
  D extends T | BuiltInScenario,
>(
  key: string,
  definition: {
    url: string;
    method?: "get" | "post" | "put" | "delete";
    scenarios: Record<T, HttpResponseResolver>;
    defaultScenario?: D;
  },
) => {
  const {
    url,
    method = "get",
    scenarios,
    defaultScenario = "default" as D,
  } = definition;

  let builder = register(key)
    .url(url)
    .method(method)
    .defaultScenario(defaultScenario);

  Object.entries(scenarios).forEach(([name, resolver]) => {
    builder = builder.scenario(name, resolver as HttpResponseResolver);
  });

  return builder.build();
};

// Backward compatibility alias
export const createScenarioHandler = createOrchestratedHandler;

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
) => {
  return Object.entries(configs).map(([key, config]) => {
    let builder = register(key)
      .url(config.url)
      .method(config.method || "get")
      .priority(config.priority || 0);

    if (config.defaultScenario) {
      builder.defaultScenario(config.defaultScenario);
    }

    Object.entries(config.scenarios).forEach(([name, resolver]) => {
      builder.scenario(name, resolver);
    });

    return builder.build();
  });
};
