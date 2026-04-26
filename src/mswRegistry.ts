import {
  http,
  HttpResponse,
  passthrough,
  bypass,
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
  HandlerPreviewResult,
  LogEntry,
  MswDevtoolsInitialScenarioMode,
  MswDevtoolsPersistenceConfig,
  MswDevtoolsPersistence,
  MswDevtoolsStorageMode,
  MswDevtoolsOptions,
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

export const USER_PREFERENCE_KEYS = {
  theme: "msw-devtools-theme",
  toggleX: "msw-devtools-x",
  toggleY: "msw-devtools-y",
  showToggleButton: "msw-show-devtools-button",
  registryFilter: "msw-scenarios-filter",
  showOnlyModified: "msw-show-only-modified",
} as const;

export const RUNTIME_STATE_KEYS = {
  scenarios: STORAGE_KEY,
  globalDelay: DELAY_KEY,
  handlerDelays: HANDLER_DELAY_KEY,
  overrides: OVERRIDES_KEY,
  passthroughSnapshot: "msw-passthrough-snapshot",
} as const;

export const AUTHORED_DATA_KEYS = {
  customScenarios: CUSTOM_SCENARIOS_KEY,
  customPresets: CUSTOM_PRESETS_KEY,
} as const;

export type MswDevtoolsPersistenceBucket =
  keyof Required<MswDevtoolsPersistenceConfig>;

const DEFAULT_PERSISTENCE_CONFIG: Required<MswDevtoolsPersistenceConfig> = {
  runtimeState: "local",
  userPreferences: "local",
  authoredData: "local",
};

const PERSISTED_CONFIG_KEYS: Array<{
  bucket: MswDevtoolsPersistenceBucket;
  key: string;
}> = [
  { bucket: "runtimeState", key: STORAGE_KEY },
  { bucket: "runtimeState", key: DELAY_KEY },
  { bucket: "runtimeState", key: HANDLER_DELAY_KEY },
  { bucket: "runtimeState", key: OVERRIDES_KEY },
  { bucket: "authoredData", key: CUSTOM_SCENARIOS_KEY },
  { bucket: "authoredData", key: CUSTOM_PRESETS_KEY },
  { bucket: "runtimeState", key: RUNTIME_STATE_KEYS.passthroughSnapshot },
];

type PersistenceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const noopStorage: PersistenceStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

let initialScenarioMode: MswDevtoolsInitialScenarioMode = "handler-default";
let initialShowToggle = true;
let resolvedPersistenceConfig: Required<MswDevtoolsPersistenceConfig> = {
  ...DEFAULT_PERSISTENCE_CONFIG,
};

const isStorageMode = (
  value: string | null | undefined,
): value is MswDevtoolsStorageMode => {
  return value === "local" || value === "session" || value === "none";
};

const normalizePersistenceConfig = (
  persistence?: MswDevtoolsPersistence,
): Required<MswDevtoolsPersistenceConfig> => {
  if (!persistence) return { ...DEFAULT_PERSISTENCE_CONFIG };

  if (typeof persistence === "string") {
    return {
      runtimeState: persistence,
      userPreferences: persistence,
      authoredData: persistence,
    };
  }

  return {
    ...DEFAULT_PERSISTENCE_CONFIG,
    ...Object.fromEntries(
      Object.entries(persistence).filter(([, value]) => isStorageMode(value)),
    ),
  };
};

const getStorageForMode = (
  mode: MswDevtoolsStorageMode,
): PersistenceStorage => {
  if (typeof window === "undefined") return noopStorage;
  if (mode === "session") return window.sessionStorage;
  if (mode === "none") return noopStorage;
  return window.localStorage;
};

const getPersistenceStorage = (
  bucket: MswDevtoolsPersistenceBucket,
): PersistenceStorage => {
  return getStorageForMode(resolvedPersistenceConfig[bucket]);
};

const readPersistedJson = <T>(
  bucket: MswDevtoolsPersistenceBucket,
  key: string,
  fallback: T,
): T => {
  try {
    const stored = getPersistenceStorage(bucket).getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writePersistedJson = (
  bucket: MswDevtoolsPersistenceBucket,
  key: string,
  value: unknown,
) => {
  getPersistenceStorage(bucket).setItem(key, JSON.stringify(value));
};

// Normalize legacy storage data on plugin load
const normalizeStorageData = () => {
  try {
    // Normalize scenarios
    const runtimeStorage = getPersistenceStorage("runtimeState");
    const storedScenarios = runtimeStorage.getItem(STORAGE_KEY);
    if (storedScenarios) {
      const scenarios = JSON.parse(storedScenarios);
      let hasChanges = false;
      const normalized: Record<string, string> = {};
      for (const [key, value] of Object.entries(scenarios)) {
        if (value === "original") {
          normalized[key] = "default";
          hasChanges = true;
        } else {
          normalized[key] = value as string;
        }
      }
      if (hasChanges) {
        runtimeStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
    }

    // Normalize presets
    const authoredDataStorage = getPersistenceStorage("authoredData");
    const storedPresets = authoredDataStorage.getItem(CUSTOM_PRESETS_KEY);
    if (storedPresets) {
      const presets = JSON.parse(storedPresets) as Array<{
        name: string;
        scenarios: Record<string, string>;
      }>;
      let hasChanges = false;
      for (const preset of presets) {
        for (const [key, value] of Object.entries(preset.scenarios)) {
          if (value === "original") {
            preset.scenarios[key] = "default";
            hasChanges = true;
          }
        }
      }
      if (hasChanges) {
        authoredDataStorage.setItem(
          CUSTOM_PRESETS_KEY,
          JSON.stringify(presets),
        );
      }
    }
  } catch {
    // Ignore errors on normalization
  }
};

const getPersistedScenarios = (): Record<string, string> => {
  return readPersistedJson("runtimeState", STORAGE_KEY, {});
};

const getPersistedHandlerDelays = (): Record<string, number> => {
  return readPersistedJson("runtimeState", HANDLER_DELAY_KEY, {});
};

const getPersistedOverrides = (): Record<string, CustomOverride> => {
  return readPersistedJson("runtimeState", OVERRIDES_KEY, {});
};

const getPersistedCustomScenarios = (): Record<
  string,
  Record<string, CustomScenario>
> => {
  return readPersistedJson("authoredData", CUSTOM_SCENARIOS_KEY, {});
};

const getPersistedCustomPresets = (): Preset[] => {
  return readPersistedJson("authoredData", CUSTOM_PRESETS_KEY, []);
};

export const scenarioState = reactive<Record<string, string>>({});
export const handlerDelays = reactive<Record<string, number>>({});
export const customOverrides = reactive<Record<string, CustomOverride>>({});
export const customScenarios = reactive<
  Record<string, Record<string, CustomScenario>>
>({});
export const customPresets = reactive<Preset[]>([]);
export const globalDelay = ref(0);
export const recordPassthrough = ref(false);

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
const handlerPreviewResolvers: Record<string, Record<string, HttpResponseResolver>> =
  {};
let baseHandlers: any[] = [];
let urlResolver: (url: string) => string = (url) => url;

const syncReactiveRecord = <T extends Record<string, unknown>>(
  target: T,
  nextState: T,
) => {
  Object.keys(target).forEach((key) => {
    delete target[key as keyof T];
  });
  Object.assign(target, nextState);
};

const hydratePersistedState = () => {
  normalizeStorageData();
  syncReactiveRecord(scenarioState, getPersistedScenarios());
  syncReactiveRecord(handlerDelays, getPersistedHandlerDelays());
  syncReactiveRecord(customOverrides, getPersistedOverrides());
  syncReactiveRecord(customScenarios, getPersistedCustomScenarios());

  const persistedPresets = getPersistedCustomPresets();
  customPresets.splice(0, customPresets.length, ...persistedPresets);

  const storedDelay = getPersistenceStorage("runtimeState").getItem(DELAY_KEY);
  globalDelay.value = storedDelay ? Number(storedDelay) || 0 : 0;
};

const resolveInitialScenario = (defaultScenario: string) =>
  initialScenarioMode === "passthrough" ? "passthrough" : defaultScenario;

const BUILT_IN_SCENARIOS: Record<string, HttpResponseResolver> = {
  passthrough: () => passthrough(),
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

const parsePreviewCode = (
  value: unknown,
): Pick<HandlerPreviewResult, "body" | "language"> => {
  if (value === null || value === undefined) {
    return { body: null, language: "json" };
  }

  if (typeof value !== "string") {
    return { body: value as object, language: "json" };
  }

  try {
    return { body: JSON.parse(value) as object, language: "json" };
  } catch {
    return { body: value, language: "text" };
  }
};

const isResponseLike = (value: unknown): value is Response => {
  return (
    typeof value === "object" &&
    value !== null &&
    "clone" in value &&
    "headers" in value &&
    "status" in value
  );
};

const extractResponsePreview = async (
  response: Response,
): Promise<Pick<HandlerPreviewResult, "body" | "language">> => {
  try {
    const clonedResponse = response.clone();
    const contentType = clonedResponse.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return {
        body: (await clonedResponse.json()) as object,
        language: "json",
      };
    }

    const text = await clonedResponse.text();
    return text ? { body: text, language: "text" } : { body: null, language: "json" };
  } catch {
    return { body: null, language: "json" };
  }
};

const buildExamplePreview = (
  exampleRequest: LogEntry,
  description: string,
  notice: string,
): HandlerPreviewResult => {
  const parsedExample =
    exampleRequest.responseBody === "__PASSTHROUGH_NO_RECORD__"
      ? { body: null, language: "json" as const }
      : parsePreviewCode(exampleRequest.responseBody);
  const exampleStatus = exampleRequest.status > 0 ? exampleRequest.status : null;

  return {
    source: "example",
    description,
    notice,
    status: exampleStatus,
    body: parsedExample.body,
    language: parsedExample.language,
    exampleStatusOnly:
      parsedExample.body === null && exampleStatus ? exampleStatus : null,
  };
};

const buildUnavailablePreview = (
  description: string,
  notice: string,
): HandlerPreviewResult => ({
  source: "unavailable",
  description,
  notice,
  status: null,
  body: null,
  language: "json",
  exampleStatusOnly: null,
});

const findExampleRequest = (key: string, activeScenario: string) => {
  const handlerRequests = activityLog.filter((entry) => entry.key === key);
  if (handlerRequests.length === 0) return null;

  if (activeScenario === "passthrough") {
    return (
      handlerRequests.find((entry) => entry.scenario.includes("Real API")) ??
      handlerRequests[0] ??
      null
    );
  }

  return (
    handlerRequests.find((entry) => entry.scenario === activeScenario) ??
    handlerRequests[0] ??
    null
  );
};

const resolvePreviewScenario = (
  key: string,
  activeScenario: string,
  metadata: HandlerMetadata,
) => {
  const resolvers = handlerPreviewResolvers[key];
  if (!resolvers) return null;

  return (
    resolvers[activeScenario] ??
    resolvers[metadata.defaultScenario] ??
    resolvers.default ??
    resolvers[Object.keys(resolvers)[0] || ""] ??
    null
  );
};

const runCodeDefinedPreview = async (
  key: string,
  activeScenario: string,
  metadata: HandlerMetadata,
): Promise<HandlerPreviewResult | null> => {
  const resolver = resolvePreviewScenario(key, activeScenario, metadata);
  if (!resolver) return null;

  const requestUrl = new URL(urlResolver(metadata.url), window.location.origin).toString();

  try {
    const response = await resolver({
      request: new Request(requestUrl, { method: metadata.method }),
      params: {},
      cookies: {},
    } as any);

    if (!isResponseLike(response)) {
      return null;
    }

    const parsed = await extractResponsePreview(response);

    return {
      source: "code",
      description: "Preview generated from the selected code-defined scenario.",
      notice: null,
      status: response.status,
      body: parsed.body,
      language: parsed.language,
      exampleStatusOnly: parsed.body === null ? response.status : null,
    };
  } catch {
    return null;
  }
};

export const getHandlerPreview = async (
  key: string,
): Promise<HandlerPreviewResult> => {
  const metadata = scenarioRegistry[key];
  if (!metadata) {
    return buildUnavailablePreview(
      "No preview data available for this handler.",
      "The selected handler is no longer registered.",
    );
  }

  const activeScenario =
    scenarioState[key] ?? metadata.defaultScenario ?? metadata.initialScenario;
  const activeOverride = customOverrides[key];
  const activeCustomScenario = customScenarios[key]?.[activeScenario] ?? null;
  const hasActiveOverride =
    !!activeOverride?.enabled && activeScenario !== "passthrough";

  if (hasActiveOverride && activeOverride) {
    const parsed = parsePreviewCode(activeOverride.body);
    return {
      source: "override",
      description: "Effective response from the active manual override.",
      notice: null,
      status: activeOverride.status,
      body: parsed.body,
      language: parsed.language,
      exampleStatusOnly: null,
    };
  }

  if (activeCustomScenario) {
    const parsed = parsePreviewCode(activeCustomScenario.body);
    return {
      source: "custom",
      description: "Preview generated from the selected custom scenario.",
      notice: null,
      status: activeCustomScenario.status,
      body: parsed.body,
      language: parsed.language,
      exampleStatusOnly: null,
    };
  }

  if (activeScenario === "passthrough") {
    const exampleRequest = findExampleRequest(key, activeScenario);

    if (exampleRequest) {
      return buildExamplePreview(
        exampleRequest,
        "Preview is unavailable because this handler currently uses the real network. Showing the latest observed response as an example.",
        "This handler is using the real API, so the response cannot be known ahead of time.",
      );
    }

    return buildUnavailablePreview(
      "Preview is unavailable because this handler currently uses the real network.",
      "This handler is using the real API, so the response cannot be known ahead of time.",
    );
  }

  if (!metadata.isNative) {
    const generatedPreview = await runCodeDefinedPreview(key, activeScenario, metadata);
    if (generatedPreview) {
      return generatedPreview;
    }

    const exampleRequest = findExampleRequest(key, activeScenario);
    if (exampleRequest) {
      return buildExamplePreview(
        exampleRequest,
        "Live preview could not be generated for this code-defined scenario. Showing the latest observed response as an example.",
        "This scenario depends on runtime request data or dynamic code paths, so the panel is showing the latest observed response instead.",
      );
    }

    return buildUnavailablePreview(
      "Preview is unavailable because this code-defined scenario depends on runtime request data.",
      "The selected scenario is defined in code, but it could not be previewed safely with a synthetic request.",
    );
  }

  const exampleRequest = findExampleRequest(key, activeScenario);
  if (exampleRequest) {
    return buildExamplePreview(
      exampleRequest,
      "Auto-discovered handlers cannot be previewed ahead of time. Showing the latest observed response as an example.",
      "Only handlers defined with defineHandlers can currently generate a preview before a real request happens.",
    );
  }

  return buildUnavailablePreview(
    "Auto-discovered handlers cannot be previewed ahead of time.",
    "Only handlers defined with defineHandlers can currently generate a preview before a real request happens.",
  );
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
  const initialScenario = resolveInitialScenario(effectiveDefault);

  if (!isNative) {
    handlerPreviewResolvers[key] = scenarios;
  }

  // Register metadata
  scenarioRegistry[key] = {
    url,
    method: method.toUpperCase(),
    isNative,
    defaultScenario: effectiveDefault,
    initialScenario,
    originalScenarios,
    scenarios: [
      ...originalScenarios,
      ...Object.keys(customScenarios[key] || {}),
    ].filter((v, i, a) => a.indexOf(v) === i), // Merge and avoid duplicates
  };

  // Initialize state if missing (URL has priority over persistence)
  const urlParams = new URLSearchParams(window.location.search);
  const urlValue = urlParams.get(key);

  if (urlValue) {
    scenarioState[key] = urlValue;
  } else if (scenarioState[key]) {
    // Already normalized in normalizeStorageData()
    scenarioState[key] = scenarioState[key];
  } else {
    scenarioState[key] = initialScenario;
  }

  // Initialize delay if missing
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
        currentUrlParams.get(key) || scenarioState[key] || initialScenario;

      const override = customOverrides[key];

      const isPassthroughActive = activeScenarioKey === "passthrough";

      if (isPassthroughActive) {
        const headers: Record<string, string> = {};
        request.headers.forEach((value: string, k: string) => {
          headers[k] = value;
        });
        const urlObj = new URL(request.url);
        const queryParams: Record<string, string> = {};
        urlObj.searchParams.forEach((value: string, k: string) => {
          queryParams[k] = value;
        });

        if (recordPassthrough.value) {
          // RECORDING MODE: Use bypass() to capture the response
          try {
            const realResponse = await fetch(bypass(request));
            const responseForLog = realResponse.clone();

            let responseBodyLog: unknown;
            const contentType = responseForLog.headers.get("content-type");
            if (contentType?.includes("application/json")) {
              responseBodyLog = await responseForLog
                .json()
                .catch(() => undefined);
            } else {
              responseBodyLog = await responseForLog
                .text()
                .catch(() => undefined);
            }

            activityLog.unshift({
              id: Math.random().toString(36).substring(2),
              timestamp: Date.now(),
              key,
              scenario: "🌐 Real API (Recorded)",
              method: method.toUpperCase(),
              url: request.url,
              status: realResponse.status,
              requestBody,
              responseBody: responseBodyLog,
              headers,
              queryParams,
              pathParams: params as Record<string, string>,
            });
            if (activityLog.length > 100) activityLog.pop();
            return realResponse;
          } catch (error) {
            activityLog.unshift({
              id: Math.random().toString(36).substring(2),
              timestamp: Date.now(),
              key,
              scenario: "❌ Real API (Error Recorded)",
              method: method.toUpperCase(),
              url: request.url,
              status: 0,
              requestBody,
              responseBody: `Network Error: ${error instanceof Error ? error.message : String(error)}`,
              headers,
              queryParams,
              pathParams: params as Record<string, string>,
            });
            if (activityLog.length > 100) activityLog.pop();

            return new HttpResponse(null, {
              status: 502,
              statusText: "Bad Gateway",
            });
          }
        } else {
          // CLEAN MODE: Use native passthrough()
          activityLog.unshift({
            id: Math.random().toString(36).substring(2),
            timestamp: Date.now(),
            key,
            scenario: "🌐 Real API (Not Recorded)",
            method: method.toUpperCase(),
            url: request.url,
            status: 0,
            requestBody,
            responseBody: "__PASSTHROUGH_NO_RECORD__",
            headers,
            queryParams,
            pathParams: params as Record<string, string>,
          });
          if (activityLog.length > 100) activityLog.pop();
          return passthrough();
        }
      }

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
  resolver?: (url: string) => string,
  options?: Pick<
    MswDevtoolsOptions,
    "initialScenarioMode" | "persistence" | "initialShowToggle"
  >,
) => {
  initialScenarioMode = options?.initialScenarioMode ?? "handler-default";
  initialShowToggle = options?.initialShowToggle ?? true;
  resolvedPersistenceConfig = normalizePersistenceConfig(options?.persistence);
  hydratePersistedState();

  mswInstance = instance;
  if (resolver) urlResolver = resolver;

  // Auto-discover handlers already present in MSW
  if (typeof instance.listHandlers === "function") {
    const existingHandlers = instance.listHandlers();

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
            default: handler.resolver || handler.run,
          },
          defaultScenario: "default",
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
      // Apply only if the handler exists
      if (scenarioRegistry[key]) {
        scenarioState[key] = scenario;
      }
    });
  }
};

// Persist persisted state using the configured storage bucket for each data type
watch(
  scenarioState,
  (newState) => {
    writePersistedJson("runtimeState", STORAGE_KEY, newState);
  },
  { deep: true },
);

watch(
  handlerDelays,
  (newDelays) => {
    writePersistedJson("runtimeState", HANDLER_DELAY_KEY, newDelays);
  },
  { deep: true },
);

watch(
  customOverrides,
  (newOverrides) => {
    writePersistedJson("runtimeState", OVERRIDES_KEY, newOverrides);
  },
  { deep: true },
);

watch(
  customScenarios,
  (newScenarios) => {
    writePersistedJson("authoredData", CUSTOM_SCENARIOS_KEY, newScenarios);
  },
  { deep: true },
);

watch(
  customPresets,
  (newPresets) => {
    writePersistedJson("authoredData", CUSTOM_PRESETS_KEY, newPresets);
  },
  { deep: true },
);

watch(globalDelay, (newDelay) => {
  getPersistenceStorage("runtimeState").setItem(DELAY_KEY, String(newDelay));
});

export const getInitialScenarioValue = (key: string) => {
  return scenarioRegistry[key]?.initialScenario || "default";
};

export const getInitialShowToggleValue = () => {
  const persistedValue = readPersistenceItem(
    "userPreferences",
    USER_PREFERENCE_KEYS.showToggleButton,
  );

  if (persistedValue === "true") return true;
  if (persistedValue === "false") return false;

  return initialShowToggle;
};

export const readPersistenceItem = (
  bucket: MswDevtoolsPersistenceBucket,
  key: string,
) => {
  return getPersistenceStorage(bucket).getItem(key);
};

export const writePersistenceItem = (
  bucket: MswDevtoolsPersistenceBucket,
  key: string,
  value: string,
) => {
  getPersistenceStorage(bucket).setItem(key, value);
};

export const removePersistenceItem = (
  bucket: MswDevtoolsPersistenceBucket,
  key: string,
) => {
  getPersistenceStorage(bucket).removeItem(key);
};

export const clearPersistedConfig = () => {
  PERSISTED_CONFIG_KEYS.forEach(({ bucket, key }) => {
    getPersistenceStorage(bucket).removeItem(key);
  });
};

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
