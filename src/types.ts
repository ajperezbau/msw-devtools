import type { HttpResponseResolver } from "msw";

/**
 * Configuration for MSW devtools metadata added to MSW handlers.
 */
export interface VueDevtoolsConfig {
  key: string;
  url: string;
  method: "get" | "post" | "put" | "delete" | "patch";
  scenarios: Record<string, HttpResponseResolver>;
  defaultScenario: string;
  priority: number;
  isNative?: boolean;
}

/**
 * Metadata for a registered handler in the MSW registry.
 */
export interface HandlerMetadata {
  url: string;
  method: string;
  scenarios: string[];
  originalScenarios: string[];
  isNative?: boolean;
}

/**
 * Represents a single request/response log entry.
 */
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
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  pathParams?: Record<string, string>;
}

/**
 * Represents a collection of scenarios that can be applied at once.
 */
export interface Preset {
  name: string;
  description?: string;
  scenarios: Record<string, string>;
}

/**
 * Custom override configuration for a handler.
 */
export interface CustomOverride {
  body: string;
  status: number;
  enabled: boolean;
}

/**
 * Custom scenario defined by the user.
 */
export interface CustomScenario {
  body: string;
  status: number;
}

/**
 * Options for the MswDevtoolsPlugin.
 */
export interface MswDevtoolsOptions {
  worker?: any;
  baseHandlers?: any[];
  urlResolver?: (url: string) => string;
}

/**
 * Export options for scenario configuration.
 */
export interface ExportOptions {
  scenarios: boolean;
  delays: boolean;
  overrides: boolean;
  customScenarios: boolean;
  customPresets: boolean;
  globalDelay: boolean;
}
