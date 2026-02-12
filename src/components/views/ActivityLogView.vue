<template>
  <div class="log-container">
    <div class="log-header">
      <div class="log-filters">
        <button
          v-for="method in [
            'ALL',
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
          ]"
          :key="method"
          type="button"
          @click="toggleMethod(method)"
          class="method-toggle-btn"
          :class="{
            active: selectedMethods.has(method),
            [method.toLowerCase()]: true,
          }"
        >
          {{ method }}
        </button>
      </div>
    </div>

    <div v-if="filterKey" class="log-filter-banner">
      <span class="filter-info">
        Showing logs for: <strong>{{ filterKey }}</strong>
      </span>
      <button
        type="button"
        @click="$emit('update:filterKey', null)"
        class="clear-filter-button"
      >
        Show All Logs
      </button>
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
          <span
            class="method-badge"
            :class="[entry.method.toLowerCase()]"
            >{{ entry.method }}</span
          >
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
              <span
                v-if="scenarioRegistry[entry.key]?.isNative"
                class="native-badge mini"
                title="Native MSW handler"
                >Native</span
              >
              <button
                type="button"
                @click.stop="handleViewInRegistry(entry.key)"
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
              </button>
            </div>
            <span class="log-scenario">
              {{ entry.scenario
              }}{{
                isCustomScenario(entry.key, entry.scenario) ? " ✨" : ""
              }}
            </span>
          </div>
          <span
            class="status-badge"
            :class="{ 'status-error': entry.status >= 400 }"
          >
            {{ entry.status }}
          </span>
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
              <input
                v-model="logSearchPath"
                placeholder="Filter JSON (e.g. data.items.*.id)"
                class="json-search-input"
              />
              <div class="json-help-wrapper">
                <button type="button" class="json-help-icon">
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
                </button>
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
              <button
                v-if="logSearchPath"
                type="button"
                @click="logSearchPath = ''"
                class="clear-json-search"
                title="Clear filter"
              >
                &times;
              </button>
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
                <button
                  type="button"
                  @click="
                    copyToClipboard(
                      getFilteredJson(entry.requestBody, logSearchPath),
                    )
                  "
                  class="mini-action-button"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
            </div>
            <pre class="details-content">{{
              formatBody(
                getFilteredJson(entry.requestBody, logSearchPath),
              )
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
                <button
                  type="button"
                  @click="
                    copyToClipboard(
                      getFilteredJson(entry.responseBody, logSearchPath),
                    )
                  "
                  class="mini-action-button"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
                <button
                  type="button"
                  @click="handleUseAsOverride(entry)"
                  class="mini-action-button"
                >
                  Use as manual override
                </button>
              </div>
            </div>
            <pre class="details-content">{{
              formatBody(
                getFilteredJson(entry.responseBody, logSearchPath),
              )
            }}</pre>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  activityLog,
  scenarioRegistry,
  customScenarios,
  type LogEntry,
} from "../../mswRegistry";

interface Props {
  filterKey?: string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "viewInRegistry", key: string): void;
  (e: "useAsOverride", entry: LogEntry): void;
  (e: "update:filterKey", value: string | null): void;
}>();

const expandedLogId = ref<string | null>(null);
const selectedMethods = ref<Set<string>>(new Set(["ALL"]));
const logSearchPath = ref("");

const filteredActivityLog = computed(() => {
  return activityLog.filter((entry) => {
    const matchesKey = !props.filterKey || entry.key === props.filterKey;
    const matchesMethod =
      selectedMethods.value.has("ALL") ||
      selectedMethods.value.has(entry.method);
    return matchesKey && matchesMethod;
  });
});

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

const handleViewInRegistry = (key: string) => {
  emit("viewInRegistry", key);
};

const handleUseAsOverride = (entry: LogEntry) => {
  emit("useAsOverride", entry);
};

const displayKey = (key: string) => {
  if (key.startsWith("http:") || key.startsWith("https:")) {
    try {
      const url = new URL(key);
      return url.pathname + url.search;
    } catch {
      return key;
    }
  }
  return key;
};

const isCustomScenario = (key: string, scenario: string) => {
  const handlerScenarios = customScenarios[key];
  return handlerScenarios ? scenario in handlerScenarios : false;
};

/**
 * Basic JSON filter using dot notation, array indices and * wildcard
 */
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

    // Support both objects and array indices (current[0])
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
</script>

<style scoped>
.log-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.log-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-main);
}

.log-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.method-toggle-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.method-toggle-btn:hover {
  background-color: var(--bg-tertiary);
}

.method-toggle-btn.active {
  border-color: var(--accent-color);
  background-color: var(--accent-soft);
  color: var(--accent-color);
}

.method-toggle-btn.get.active {
  border-color: #22c55e;
  background-color: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.method-toggle-btn.post.active {
  border-color: #eab308;
  background-color: rgba(234, 179, 8, 0.15);
  color: #eab308;
}

.method-toggle-btn.put.active {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.method-toggle-btn.patch.active {
  border-color: #a855f7;
  background-color: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.method-toggle-btn.delete.active {
  border-color: #ef4444;
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.log-filter-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-soft);
  border-bottom: 1px solid var(--accent-color);
}

.filter-info {
  font-size: 0.875rem;
  color: var(--text-main);
}

.clear-filter-button {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  border: 1px solid var(--accent-color);
  background-color: transparent;
  color: var(--accent-color);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filter-button:hover {
  background-color: var(--accent-color);
  color: white;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.log-entry {
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  overflow: hidden;
  transition: all 0.2s;
}

.log-entry.is-error {
  border-color: rgba(239, 68, 68, 0.3);
  background-color: rgba(239, 68, 68, 0.05);
}

.log-entry-header {
  padding: 0.75rem 1rem;
  display: grid;
  grid-template-columns: 70px auto 1fr auto auto 24px;
  gap: 0.75rem;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.log-entry-header:hover {
  background-color: var(--bg-tertiary);
}

.log-time {
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-tertiary);
}

.log-url {
  font-size: 0.875rem;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
}

.log-request-preview {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
}

.log-scenario-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}

.log-key-wrapper {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.log-key {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: monospace;
}

.log-scenario {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.status-badge {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 0.375rem;
  background-color: var(--bg-tertiary);
  color: var(--text-main);
  min-width: 40px;
  text-align: center;
}

.status-badge.status-error {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.expand-icon {
  transition: transform 0.2s;
  color: var(--text-tertiary);
}

.log-entry.is-expanded .expand-icon {
  transform: rotate(180deg);
}

.log-details {
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-main);
}

.json-search-bar {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.json-search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.search-icon {
  color: var(--text-tertiary);
}

.json-search-input {
  flex: 1;
  padding: 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-main);
  font-family: monospace;
}

.json-help-wrapper {
  position: relative;
}

.json-help-icon {
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: help;
  display: flex;
  align-items: center;
  justify-content: center;
}

.json-help-icon:hover + .custom-tooltip {
  display: block;
}

.custom-tooltip {
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  background-color: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  width: 280px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.custom-tooltip div {
  margin-top: 0.25rem;
}

.clear-json-search {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.clear-json-search:hover {
  color: var(--text-main);
}

.details-section {
  padding: 1rem 1.5rem;
}

.details-section + .details-section {
  border-top: 1px solid var(--border-color);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.details-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.details-actions {
  display: flex;
  gap: 0.5rem;
}

.mini-action-button {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
}

.mini-action-button:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent-color);
}

.details-content {
  margin: 0;
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.5;
  overflow-x: auto;
  font-family: monospace;
  color: var(--text-main);
}

.mini-icon-button {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.15rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
}

.log-entry-header:hover .mini-icon-button {
  opacity: 1;
}

.mini-icon-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
}

.native-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.native-badge.mini {
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  color: var(--text-tertiary);
  text-align: center;
}

.method-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
  display: inline-block;
}

:global(.theme-light) .method-badge.get {
  background-color: #dcfce7;
  color: #166534;
}
:global(.theme-light) .method-badge.post {
  background-color: #fef9c3;
  color: #854d0e;
}
:global(.theme-light) .method-badge.put {
  background-color: #dbeafe;
  color: #1e40af;
}
:global(.theme-light) .method-badge.patch {
  background-color: #f3e8ff;
  color: #6b21a8;
}
:global(.theme-light) .method-badge.delete {
  background-color: #fee2e2;
  color: #991b1b;
}

:global(.theme-dark) .method-badge.get {
  background-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}
:global(.theme-dark) .method-badge.post {
  background-color: rgba(234, 179, 8, 0.2);
  color: #facc15;
}
:global(.theme-dark) .method-badge.put {
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}
:global(.theme-dark) .method-badge.patch {
  background-color: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}
:global(.theme-dark) .method-badge.delete {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
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
