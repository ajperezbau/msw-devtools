<template>
  <div class="log-container">
    <div class="log-header">
      <div class="log-filters">
        <MswButton
          v-for="method in ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE']"
          :key="method"
          type="button"
          variant="ghost"
          size="sm"
          @click="toggleMethod(method)"
          class="method-toggle-btn"
          :class="{
            active: selectedMethods.has(method),
            [method.toLowerCase()]: true,
          }"
        >
          {{ method }}
        </MswButton>
      </div>
      <MswButton type="button" @click="clearActivityLog" title="Clear logs">
        Clear
      </MswButton>
    </div>

    <div v-if="filterKey" class="log-filter-banner">
      <span class="filter-info">
        Showing logs for: <strong>{{ filterKey }}</strong>
      </span>
      <MswButton
        type="button"
        variant="ghost"
        @click="emit('update:filterKey', null)"
        class="clear-filter-button"
      >
        Show All Logs
      </MswButton>
    </div>

    <div v-if="filteredActivityLog.length === 0" class="empty-state">
      {{
        filterKey
          ? "No requests recorded for this handler."
          : "No requests recorded yet."
      }}
    </div>
    <div v-else class="log-list" role="list">
      <div
        v-for="entry in filteredActivityLog"
        :key="entry.id"
        class="log-entry"
        role="listitem"
        :class="{
          'is-expanded': expandedLogId === entry.id,
          'is-error': entry.status >= 400,
        }"
      >
        <div class="log-entry-header" @click="toggleLogEntry(entry.id)">
          <span class="log-time">{{ formatTime(entry.timestamp) }}</span>
          <MswBadge variant="method" :label="entry.method" />
          <div class="log-url" :title="entry.url">
            {{ entry.url }}
          </div>
          <div
            v-if="entry.method !== 'GET' && entry.requestBody"
            class="log-request-preview"
            :title="JSON.stringify(entry.requestBody)"
          >
            {{ formatPreview(entry.requestBody) }}
          </div>
          <div class="log-scenario-info">
            <div class="log-key-wrapper">
              <span class="log-key">{{ displayKey(entry.key) }}</span>
              <MswBadge
                v-if="scenarioRegistry[entry.key]?.isNative"
                variant="native"
                label="Native"
                size="sm"
                title="Native MSW handler"
              />
              <MswButton
                type="button"
                variant="icon"
                size="sm"
                @click.stop="emit('view-handler', entry.key)"
                class="mini-icon-button"
                title="View in Registry"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </MswButton>
            </div>
            <span class="log-scenario">
              {{ entry.scenario
              }}{{ isCustomScenario(entry.key, entry.scenario) ? " ✨" : "" }}
            </span>
          </div>
          <MswBadge variant="status" :label="String(entry.status)" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="expand-icon h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        <div v-if="expandedLogId === entry.id" class="log-details">
          <div
            class="json-search-bar"
            v-if="entry.requestBody || entry.responseBody"
          >
            <div class="json-search-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="search-icon h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <MswInput
                v-model="logSearchPath"
                placeholder="Filter JSON (e.g. data.items.*.id)"
                variant="inline"
                size="sm"
                class="json-search-input"
              />
              <div class="json-help-wrapper">
                <MswButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="json-help-icon"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </MswButton>
                <div class="custom-tooltip">
                  <strong>JSON Path filtering:</strong>
                  <div>• Use <b>.</b> for nesting (e.g., data.id)</div>
                  <div>
                    • Use <b>[n]</b> or <b>.n</b> for array index (e.g.,
                    items[0])
                  </div>
                  <div>
                    • Use <b>*</b> to map over arrays/objects (e.g.,
                    items.*.name)
                  </div>
                </div>
              </div>
              <MswButton
                v-if="logSearchPath"
                type="button"
                variant="ghost"
                size="sm"
                @click="logSearchPath = ''"
                class="clear-json-search"
                title="Clear filter"
              >
                &times;
              </MswButton>
            </div>
          </div>

          <section
            v-if="entry.requestBody"
            class="details-section"
            aria-label="Request Body"
          >
            <div class="details-header">
              <h4 class="details-title">Request Body</h4>
              <div class="details-actions">
                <MswButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="
                    copyToClipboard(
                      getFilteredJson(entry.requestBody, logSearchPath),
                    )
                  "
                  class="mini-action-button"
                  title="Copy to clipboard"
                >
                  Copy
                </MswButton>
              </div>
            </div>
            <pre class="details-content">{{
              formatBody(getFilteredJson(entry.requestBody, logSearchPath))
            }}</pre>
          </section>
          <section
            v-if="entry.responseBody"
            class="details-section"
            aria-label="Response Body"
          >
            <div class="details-header">
              <h4 class="details-title">Response Body</h4>
              <div class="details-actions">
                <MswButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="
                    copyToClipboard(
                      getFilteredJson(entry.responseBody, logSearchPath),
                    )
                  "
                  class="mini-action-button"
                  title="Copy to clipboard"
                >
                  Copy
                </MswButton>
                <MswButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  @click="emit('open-override', entry)"
                  class="mini-action-button"
                >
                  Use as manual override
                </MswButton>
              </div>
            </div>
            <pre class="details-content">{{
              formatBody(getFilteredJson(entry.responseBody, logSearchPath))
            }}</pre>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import MswBadge from "./MswBadge.vue";
import MswButton from "./MswButton.vue";
import MswInput from "./MswInput.vue";
import {
  activityLog,
  clearActivityLog,
  scenarioRegistry,
  customScenarios,
  displayKey,
} from "../mswRegistry";
import type { LogEntry } from "../types";

const props = defineProps<{
  filterKey: string | null;
}>();

const emit = defineEmits<{
  (e: "update:filterKey", value: string | null): void;
  (e: "open-override", entry: LogEntry): void;
  (e: "view-handler", key: string): void;
}>();

const expandedLogId = ref<string | null>(null);
const selectedMethods = ref<Set<string>>(new Set(["ALL"]));
const logSearchPath = ref("");

const isCustomScenario = (key: string, scenarioName: string) => {
  return customScenarios[key] && customScenarios[key][scenarioName];
};

const toggleLogEntry = (id: string) => {
  expandedLogId.value = expandedLogId.value === id ? null : id;
};

const toggleMethod = (method: string) => {
  if (method === "ALL") {
    selectedMethods.value.clear();
    selectedMethods.value.add("ALL");
  } else {
    selectedMethods.value.delete("ALL");
    if (selectedMethods.value.has(method)) {
      selectedMethods.value.delete(method);
      if (selectedMethods.value.size === 0) {
        selectedMethods.value.add("ALL");
      }
    } else {
      selectedMethods.value.add(method);
    }
  }
};

const getFilteredJson = (data: unknown, path: string) => {
  if (!path || !data || typeof data !== "object") return data;

  // Normalize path: items[0].id -> items.0.id
  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1").replace(/^\./, "");
  const parts = normalizedPath.split(".").filter(Boolean);

  const navigate = (current: unknown, segments: string[]): unknown => {
    if (segments.length === 0) return current;
    if (!current || typeof current !== "object") return undefined;

    const [head, ...tail] = segments;

    if (head === "*") {
      if (Array.isArray(current)) {
        const results = current
          .map((item) => navigate(item, tail))
          .filter((v) => v !== undefined);
        return results.length > 0 ? results : undefined;
      } else {
        const results: Record<string, unknown> = {};
        const entries = Object.entries(current as Record<string, unknown>);
        for (const [key, val] of entries) {
          const value = navigate(val, tail);
          if (value !== undefined) results[key] = value;
        }
        return Object.keys(results).length > 0 ? results : undefined;
      }
    }

    if (head === undefined) return current;
    return navigate((current as Record<string, unknown>)[head], tail);
  };

  const result = navigate(data, parts);
  return result !== undefined ? result : "No matches found";
};

const formatBody = (body: unknown) => {
  if (body === undefined || body === null) return "";
  if (typeof body === "string") return body;
  return JSON.stringify(body, null, 2);
};

const formatPreview = (body: unknown) => {
  if (body === undefined || body === null) return "";
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return text.length > 60 ? text.substring(0, 60) + "..." : text;
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const copyToClipboard = async (data: unknown) => {
  try {
    const text =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(text);
  } catch {
    // Fail silently
  }
};

const filteredActivityLog = computed(() => {
  return activityLog.filter((entry) => {
    const matchesKey = !props.filterKey || entry.key === props.filterKey;
    const matchesMethod =
      selectedMethods.value.has("ALL") ||
      selectedMethods.value.has(entry.method);
    return matchesKey && matchesMethod;
  });
});
</script>

<style scoped>
.log-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-main);
}

.log-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-secondary);
}

.log-filters {
  display: flex;
  gap: 0.25rem;
}

.method-toggle-btn.msw-button {
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-tertiary);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.method-toggle-btn.msw-button:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.method-toggle-btn.msw-button.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.method-toggle-btn.msw-button.active.all {
  background-color: var(--method-all-bg);
  color: var(--method-all-text);
  border-color: var(--method-all-border);
}

.method-toggle-btn.msw-button.active.get {
  background-color: var(--method-get-bg);
  color: var(--method-get-text);
  border-color: var(--method-get-border);
}

.method-toggle-btn.msw-button.active.post {
  background-color: var(--method-post-bg);
  color: var(--method-post-text);
  border-color: var(--method-post-border);
}

.method-toggle-btn.msw-button.active.put {
  background-color: var(--method-put-bg);
  color: var(--method-put-text);
  border-color: var(--method-put-border);
}

.method-toggle-btn.msw-button.active.patch {
  background-color: var(--method-patch-bg);
  color: var(--method-patch-text);
  border-color: var(--method-patch-border);
}

.method-toggle-btn.msw-button.active.delete {
  background-color: var(--method-delete-bg);
  color: var(--method-delete-text);
  border-color: var(--method-delete-border);
}

.log-filter-banner {
  padding: 0.5rem 1rem;
  background-color: var(--accent-soft);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-info {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.clear-filter-button.msw-button {
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.log-list {
  flex: 1;
  overflow-y: auto;
}

.log-entry {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s;
}

.log-entry:hover {
  background-color: var(--bg-secondary);
}

.log-entry.is-expanded {
  background-color: var(--bg-secondary);
}

.log-entry.is-error {
  border-left: 3px solid #ef4444;
}

.log-entry-header {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.log-time {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.65rem;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.log-url {
  flex: 1;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-request-preview {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  background-color: var(--bg-tertiary);
  padding: 0.1rem 0.4rem;
  border-radius: 0.25rem;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-scenario-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  min-width: 120px;
}

.log-key-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.log-key {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-tertiary);
}

.log-scenario {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--accent-color);
}

.expand-icon {
  color: var(--text-tertiary);
  transition: transform 0.2s;
}

.is-expanded .expand-icon {
  transform: rotate(180deg);
}

.log-details {
  padding: 1rem;
  background-color: var(--bg-main);
  border-top: 1px dashed var(--border-color);
}

.details-section {
  margin-bottom: 1rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.details-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin: 0;
}

.mini-action-button.msw-button {
  font-size: 0.65rem;
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  padding: 0.1rem 0.4rem;
  cursor: pointer;
  font-weight: 600;
}

.mini-action-button.msw-button:hover {
  background-color: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

.details-content {
  margin: 0;
  padding: 0.75rem;
  background-color: var(--bg-tertiary);
  color: var(--text-main);
  border-radius: 0.5rem;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  overflow-x: auto;
  white-space: pre-wrap;
  max-height: 400px;
  border: 1px solid var(--border-color);
}

.theme-dark .details-content {
  background-color: #121212;
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.json-search-bar {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed var(--border-color);
}

.json-search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 0.25rem 0.75rem;
  transition: all 0.2s;
}

.json-search-container:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.json-search-input.msw-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.75rem;
  padding: 0.25rem 0;
  color: var(--text-main);
  background-color: transparent;
}

.search-icon {
  color: var(--text-tertiary);
}

.json-help-icon.msw-button {
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--text-tertiary);
  cursor: help;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  border-radius: 0.25rem;
}

.json-help-icon.msw-button:hover {
  color: var(--text-secondary);
  background-color: var(--bg-tertiary);
}

.json-help-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.custom-tooltip {
  visibility: hidden;
  position: absolute;
  bottom: 125%;
  right: 0;
  background-color: #1f2937;
  color: white;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  z-index: 10002;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.25);
  width: max-content;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  border: 1px solid #374151;
}

.custom-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  right: 12px;
  border-width: 6px;
  border-style: solid;
  border-color: #1f2937 transparent transparent transparent;
}

.json-help-wrapper:hover .custom-tooltip {
  visibility: visible;
  opacity: 1;
}

.clear-json-search.msw-button {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-json-search.msw-button:hover {
  color: var(--text-main);
}

.mini-icon-button.msw-button {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.mini-icon-button.msw-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--accent-color);
}

.h-3 {
  height: 0.75rem;
}
.w-3 {
  width: 0.75rem;
}
.h-4 {
  height: 1rem;
}
.w-4 {
  width: 1rem;
}
</style>
