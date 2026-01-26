<template>
  <div class="scenario-selector-overlay">
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="toggle-button"
      title="MSW Handler Registry (Ctrl + Shift + M)"
      aria-label="Toggle MSW DevTools"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>

    <div v-if="isOpen" class="modal-backdrop" @click.self="isOpen = false">
      <div
        class="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="msw-devtools-title"
      >
        <div class="panel-header">
          <h2 id="msw-devtools-title" class="panel-title">
            MSW Handler Registry
          </h2>
          <div class="tab-buttons">
            <button
              type="button"
              @click="activeTab = 'registry'"
              class="tab-button"
              :class="{ active: activeTab === 'registry' }"
            >
              Registry
            </button>
            <button
              type="button"
              @click="activeTab = 'log'"
              class="tab-button"
              :class="{ active: activeTab === 'log' }"
            >
              Activity Log ({{ activityLog.length }})
            </button>
          </div>
          <div class="panel-actions">
            <button
              v-if="activeTab === 'log'"
              type="button"
              @click="clearActivityLog"
              class="clear-button"
              title="Clear log"
            >
              Clear Log
            </button>
            <button
              type="button"
              @click="clearConfigs"
              class="clear-button"
              title="Clear all stored scenarios"
            >
              Reset All
            </button>
            <button
              type="button"
              @click="reloadPage"
              class="reload-button"
              title="Apply & Reload (Ctrl + Enter)"
            >
              Apply & Reload
            </button>
            <button
              type="button"
              @click="isOpen = false"
              class="close-button"
              title="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="search-container" v-if="activeTab === 'registry'">
          <div class="search-wrapper">
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Filter by key, URL or method..."
              class="search-input"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="clear-search-button"
              title="Clear search"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div class="modified-filter">
            <label class="filter-label">
              <input
                type="checkbox"
                v-model="showOnlyModified"
                class="filter-checkbox"
              />
              Modified only
            </label>
          </div>
          <div class="global-delay-control">
            <label for="global-delay">Global Delay: {{ globalDelay }}ms</label>
            <input
              id="global-delay"
              type="range"
              v-model.number="globalDelay"
              min="0"
              max="5000"
              step="100"
              class="delay-slider"
            />
          </div>
        </div>

        <div class="registry-container" v-if="activeTab === 'registry'">
          <table class="registry-table">
            <thead>
              <tr>
                <th class="col-status"></th>
                <th class="col-method">Method</th>
                <th class="col-info">Handler</th>
                <th class="col-scenario">Active Scenario</th>
                <th class="col-delay">Delay (ms)</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredRegistryKeys.length === 0">
                <td colspan="6" class="empty-state">
                  No handlers found matching your search.
                </td>
              </tr>
              <tr
                v-for="key in filteredRegistryKeys"
                :key="key"
                :class="{ 'is-modified': isModified(key) }"
              >
                <td class="col-status">
                  <span
                    v-if="customOverrides[key]?.enabled"
                    class="override-indicator"
                    title="Manual override active"
                  >
                    M
                  </span>
                  <span
                    v-else-if="isModified(key)"
                    class="modified-indicator"
                    title="Scenario modified"
                  >
                    •
                  </span>
                </td>
                <td class="col-method">
                  <span
                    v-if="scenarioRegistry[key]"
                    class="method-badge"
                    :class="[scenarioRegistry[key].method.toLowerCase()]"
                  >
                    {{ scenarioRegistry[key].method }}
                  </span>
                </td>
                <td class="col-info">
                  <div class="handler-info" v-if="scenarioRegistry[key]">
                    <span class="key-text">{{ key }}</span>
                    <div class="url-wrapper" :title="scenarioRegistry[key].url">
                      {{ scenarioRegistry[key].url }}
                    </div>
                  </div>
                </td>
                <td class="col-scenario">
                  <select
                    v-model="scenarioState[key]"
                    class="scenario-select"
                    :class="{ 'is-modified': isModified(key) }"
                  >
                    <option
                      v-for="scenario in scenarioRegistry[key]?.scenarios"
                      :key="scenario"
                      :value="scenario"
                    >
                      {{ scenario
                      }}{{ isCustomScenario(key, scenario) ? " ✨" : "" }}
                    </option>
                  </select>
                </td>
                <td class="col-delay">
                  <div class="handler-delay-wrapper">
                    <input
                      type="number"
                      v-model.number="handlerDelays[key]"
                      min="0"
                      max="10000"
                      step="50"
                      placeholder="0"
                      class="handler-delay-input"
                    />
                    <span class="ms-label">ms</span>
                  </div>
                </td>
                <td class="col-actions">
                  <div class="action-buttons">
                    <button
                      type="button"
                      @click="openOverrideEditor(key)"
                      class="icon-button"
                      :class="{ 'has-override': customOverrides[key]?.enabled }"
                      title="Custom response override"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      @click="viewLogForKey(key)"
                      class="icon-button"
                      title="View logs for this handler"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="editingOverrideKey" class="override-editor-overlay">
          <div class="override-editor-content">
            <div class="editor-header">
              <h3>Override Response: {{ editingOverrideKey }}</h3>
              <button
                type="button"
                @click="editingOverrideKey = null"
                class="close-button"
              >
                &times;
              </button>
            </div>
            <div class="editor-body">
              <div class="input-group">
                <label>HTTP Status</label>
                <input
                  type="number"
                  v-model.number="overrideForm.status"
                  class="status-input"
                />
              </div>
              <div class="input-group">
                <div class="label-with-action">
                  <label>Response Body (JSON or Text)</label>
                  <button
                    type="button"
                    @click="formatEditorJson"
                    class="format-button"
                  >
                    Format JSON
                  </button>
                </div>
                <textarea
                  v-model="overrideForm.body"
                  class="body-textarea"
                  placeholder='{"key": "value"}'
                ></textarea>
              </div>
            </div>
            <div class="editor-footer">
              <button
                type="button"
                @click="clearOverride"
                class="secondary-button"
                v-if="customOverrides[editingOverrideKey]"
              >
                Clear Override
              </button>
              <button
                type="button"
                @click="saveAsScenario"
                class="secondary-button"
                title="Save this response as a reusable scenario"
              >
                Save as Scenario
              </button>
              <div class="spacer"></div>
              <button
                type="button"
                @click="editingOverrideKey = null"
                class="secondary-button"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="saveOverride"
                class="primary-button"
              >
                Save & Enable
              </button>
            </div>
          </div>
        </div>

        <div class="log-container" v-if="activeTab === 'log'">
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

          <div v-if="logFilterKey" class="log-filter-banner">
            <span class="filter-info">
              Showing logs for: <strong>{{ logFilterKey }}</strong>
            </span>
            <button
              type="button"
              @click="logFilterKey = null"
              class="clear-filter-button"
            >
              Show All Logs
            </button>
          </div>

          <div v-if="filteredActivityLog.length === 0" class="empty-state">
            {{
              logFilterKey
                ? "No requests recorded for this handler."
                : "No requests recorded yet."
            }}
          </div>
          <div v-else class="log-list">
            <div
              v-for="entry in filteredActivityLog"
              :key="entry.id"
              class="log-entry"
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
                <div class="log-scenario-info">
                  <div class="log-key-wrapper">
                    <span class="log-key">{{ entry.key }}</span>
                    <button
                      type="button"
                      @click.stop="viewHandlerForKey(entry.key)"
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

                <div v-if="entry.requestBody" class="details-section">
                  <div class="details-header">
                    <div class="details-title">Request Body</div>
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
                </div>
                <div v-if="entry.responseBody" class="details-section">
                  <div class="details-header">
                    <div class="details-title">Response Body</div>
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
                        @click="openOverrideEditorFromLog(entry)"
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import {
  activityLog,
  clearActivityLog,
  customOverrides,
  customScenarios,
  globalDelay,
  handlerDelays,
  scenarioRegistry,
  scenarioState,
  type LogEntry,
} from "./mswRegistry";

const isOpen = ref(false);
const activeTab = ref<"registry" | "log">("registry");
const searchQuery = ref(localStorage.getItem("msw-scenarios-filter") || "");
const showOnlyModified = ref(
  localStorage.getItem("msw-show-only-modified") === "true",
);
const searchInput = ref<HTMLInputElement | null>(null);
const expandedLogId = ref<string | null>(null);
const logFilterKey = ref<string | null>(null);
const selectedMethods = ref<Set<string>>(new Set(["ALL"]));
const logSearchPath = ref("");

const editingOverrideKey = ref<string | null>(null);
const overrideForm = ref({
  body: "",
  status: 200,
  enabled: true,
});

const openOverrideEditor = (key: string) => {
  editingOverrideKey.value = key;
  const existing = customOverrides[key];
  overrideForm.value = {
    body: existing?.body ?? "",
    status: existing?.status ?? 200,
    enabled: true,
  };
};

const openOverrideEditorFromLog = (entry: LogEntry) => {
  editingOverrideKey.value = entry.key;
  overrideForm.value = {
    body: formatBody(entry.responseBody),
    status: entry.status,
    enabled: true,
  };
};

const saveOverride = () => {
  if (editingOverrideKey.value) {
    customOverrides[editingOverrideKey.value] = {
      ...overrideForm.value,
    };
    editingOverrideKey.value = null;
  }
};

const formatEditorJson = () => {
  const body = overrideForm.value.body.trim();
  if (!body) return;

  try {
    // Try to parse as JSON. If it's a string that looks like an object/array, format it.
    const parsed = JSON.parse(body);
    overrideForm.value.body = JSON.stringify(parsed, null, 2);
  } catch {
    // If it's not valid JSON, maybe it's just a string, we don't format it
  }
};

const saveAsScenario = () => {
  if (!editingOverrideKey.value) return;

  const scenarioName = window.prompt("Enter a name for this custom scenario:");
  if (!scenarioName) return;

  const key = editingOverrideKey.value;

  if (!customScenarios[key]) {
    customScenarios[key] = {};
  }

  customScenarios[key][scenarioName] = {
    body: overrideForm.value.body,
    status: overrideForm.value.status,
  };

  // Update registry so it shows up in the dropdown immediately
  if (
    scenarioRegistry[key] &&
    !scenarioRegistry[key].scenarios.includes(scenarioName)
  ) {
    scenarioRegistry[key].scenarios.push(scenarioName);
  }

  // Select the new scenario and disable manual override so it takes effect
  scenarioState[key] = scenarioName;
  delete customOverrides[key];

  editingOverrideKey.value = null;
};

const clearOverride = () => {
  if (editingOverrideKey.value) {
    delete customOverrides[editingOverrideKey.value];
    editingOverrideKey.value = null;
  }
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

const viewLogForKey = (key: string) => {
  logFilterKey.value = key;
  activeTab.value = "log";
};

const viewHandlerForKey = (key: string) => {
  activeTab.value = "registry";
  searchQuery.value = key;
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
    // Optional: show some temporary success state if needed
  } catch {
    // Fail silently or handle error
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && isOpen.value) {
    isOpen.value = false;
  }

  // Toggle with Ctrl + Shift + M
  if (
    (e.ctrlKey || e.metaKey) &&
    e.shiftKey &&
    (e.key === "M" || e.key === "m")
  ) {
    e.preventDefault();
    isOpen.value = !isOpen.value;
  }

  // Apply & Reload with Ctrl + Enter
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && isOpen.value) {
    e.preventDefault();
    reloadPage();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

const focusSearch = async () => {
  await nextTick();
  searchInput.value?.focus();
};

const reloadPage = () => {
  isOpen.value = false;
  window.location.reload();
};

const clearConfigs = () => {
  localStorage.removeItem("msw-scenarios");
  localStorage.removeItem("msw-handler-delays");
  localStorage.removeItem("msw-overrides");
  localStorage.removeItem("msw-custom-scenarios");

  // Reset all scenarios to 'default' in the reactive state
  Object.keys(scenarioState).forEach((key) => {
    scenarioState[key] = "default";
  });

  // Reset all handler delays to 0
  Object.keys(handlerDelays).forEach((key) => {
    handlerDelays[key] = 0;
  });

  // Clear all overrides
  Object.keys(customOverrides).forEach((key) => {
    delete customOverrides[key];
  });

  // Clear all custom scenarios
  Object.keys(customScenarios).forEach((key) => {
    delete customScenarios[key];
  });
};

const isModified = (key: string) => {
  const scenarioModified =
    scenarioState[key] && scenarioState[key] !== "default";
  const delayModified = handlerDelays[key] && handlerDelays[key] > 0;
  const hasOverride = customOverrides[key]?.enabled;
  return scenarioModified || delayModified || hasOverride;
};

const isCustomScenario = (key: string, scenario: string) => {
  return !!customScenarios[key]?.[scenario];
};

watch(isOpen, (newValue) => {
  if (newValue) {
    focusSearch();
  }
});

watch(searchQuery, (newFilter) => {
  localStorage.setItem("msw-scenarios-filter", newFilter);
});

watch(showOnlyModified, (newValue) => {
  localStorage.setItem("msw-show-only-modified", String(newValue));
});

const filteredRegistryKeys = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return Object.keys(scenarioRegistry).filter((key) => {
    const metadata = scenarioRegistry[key];
    if (!metadata) return false;

    // Filter by modified status if enabled
    if (showOnlyModified.value && !isModified(key)) {
      return false;
    }

    // Filter by search query
    return (
      key.toLowerCase().includes(query) ||
      metadata.url.toLowerCase().includes(query) ||
      metadata.method.toLowerCase().includes(query)
    );
  });
});

const filteredActivityLog = computed(() => {
  return activityLog.filter((entry) => {
    const matchesKey = !logFilterKey.value || entry.key === logFilterKey.value;
    const matchesMethod =
      selectedMethods.value.has("ALL") ||
      selectedMethods.value.has(entry.method);
    return matchesKey && matchesMethod;
  });
});
</script>

<style scoped>
.h-6 {
  height: 1.5rem;
}
.w-6 {
  width: 1.5rem;
}
.h-5 {
  height: 1.25rem;
}
.w-5 {
  width: 1.25rem;
}
.h-4 {
  height: 1rem;
}
.w-4 {
  width: 1rem;
}
.h-3 {
  height: 0.75rem;
}
.w-3 {
  width: 0.75rem;
}

.scenario-selector-overlay {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 10000;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.toggle-button {
  background-color: #2563eb;
  color: white;
  padding: 1rem;
  border-radius: 9999px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-button:hover {
  background-color: #1d4ed8;
  transform: scale(1.05);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 10001;
}

.modal-content {
  background-color: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 1600px;
  height: 95vh;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.panel-header {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.tab-buttons {
  display: flex;
  gap: 0.5rem;
  margin: 0 1.5rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.tab-button.active {
  background-color: #dbeafe;
  color: #1e40af;
}

.panel-actions {
  display: flex;
  gap: 0.75rem;
  margin-left: auto;
  align-items: center;
}

.clear-button {
  background-color: white;
  color: #4b5563;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid #d1d5db;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-button:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.reload-button {
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reload-button:hover {
  background-color: #1d4ed8;
}

.close-button {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.search-container {
  padding: 1rem 1.5rem;
  background-color: white;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.search-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.clear-search-button {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-search-button:hover {
  background-color: #e5e7eb;
  color: #4b5563;
}

.global-delay-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 280px;
  flex-shrink: 0;
  background-color: #f9fafb;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.global-delay-control label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #4b5563;
  white-space: nowrap;
  width: 130px;
}

.delay-slider {
  flex: 1;
  cursor: pointer;
}

.search-input {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid #d1d5db;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-size: 1rem;
  color: #111827;
  background-color: #f9fafb;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modified-filter {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  user-select: none;
}

.filter-checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.registry-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.log-container {
  flex: 1;
  overflow-y: auto;
  background-color: #f9fafb;
  display: flex;
  flex-direction: column;
}

.log-header {
  padding: 0.75rem 1.5rem;
  background-color: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.log-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.method-toggle-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.method-toggle-btn:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.method-toggle-btn.active {
  border-color: transparent;
}

.method-toggle-btn.active.all {
  background-color: #f3f4f6;
  color: #374151;
}
.method-toggle-btn.active.get {
  background-color: #dcfce7;
  color: #166534;
}
.method-toggle-btn.active.post {
  background-color: #fef9c3;
  color: #854d0e;
}
.method-toggle-btn.active.put {
  background-color: #dbeafe;
  color: #1e40af;
}
.method-toggle-btn.active.patch {
  background-color: #f3e8ff;
  color: #6b21a8;
}
.method-toggle-btn.active.delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.log-filter-banner {
  padding: 0.75rem 1.5rem;
  background-color: #eff6ff;
  border-bottom: 1px solid #dbeafe;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-info {
  font-size: 0.875rem;
  color: #1e40af;
}

.clear-filter-button {
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
  background: white;
  border: 1px solid #d1d5db;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filter-button:hover {
  border-color: #2563eb;
  background-color: #f8faff;
}

.log-list {
  display: flex;
  flex-direction: column;
}

.log-entry {
  border-bottom: 1px solid #e5e7eb;
  background-color: white;
}

.log-entry.is-error {
  border-left: 4px solid #ef4444;
}

.log-entry-header {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.1s;
}

.log-entry-header:hover {
  background-color: #f3f4f6;
}

.log-time {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  color: #6b7280;
  width: 80px;
}

.log-url {
  flex: 1;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.8125rem;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-scenario-info {
  display: flex;
  flex-direction: column;
  width: 200px;
}

.log-key-wrapper {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.mini-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  border-radius: 0.25rem;
  background-color: transparent;
  color: #9ca3af;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.log-entry-header:hover .mini-icon-button {
  color: #6b7280;
  border-color: #d1d5db;
  background-color: #f3f4f6;
}

.mini-icon-button:hover {
  background-color: #eff6ff !important;
  color: #2563eb !important;
  border-color: #2563eb !important;
}

.log-key {
  font-size: 0.75rem;
  font-weight: 700;
  color: #111827;
}

.log-scenario {
  font-size: 0.6875rem;
  color: #6b7280;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background-color: #dcfce7;
  color: #166534;
  min-width: 40px;
  text-align: center;
}

.status-badge.status-error {
  background-color: #fee2e2;
  color: #991b1b;
}

.expand-icon {
  color: #9ca3af;
  transition: transform 0.2s;
}

.is-expanded .expand-icon {
  transform: rotate(180deg);
}

.log-details {
  padding: 1rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.details-section {
  margin-bottom: 1rem;
}

.details-section:last-child {
  margin-bottom: 0;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.details-actions {
  display: flex;
  gap: 0.5rem;
}

.details-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 0;
}

.mini-action-button {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mini-action-button:hover {
  background-color: #1d4ed8;
}

.override-editor-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 2rem;
}

.override-editor-content {
  background-color: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 80vh;
}

.editor-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.editor-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #4b5563;
}

.label-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.format-button {
  font-size: 0.6875rem;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-weight: 600;
}

.format-button:hover {
  background-color: #e5e7eb;
}

.status-input {
  width: 100px;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.body-textarea {
  height: 250px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  resize: vertical;
}

.editor-footer {
  padding: 1.25rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
}

.spacer {
  flex: 1;
}

.primary-button {
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.secondary-button {
  background-color: white;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  font-weight: 600;
  cursor: pointer;
}

.icon-button.has-override {
  color: #d97706;
  background-color: #fffbeb;
}

.override-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #d97706;
  color: white;
  font-size: 10px;
  font-weight: 800;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.details-content {
  margin: 0;
  padding: 0.75rem;
  background-color: #1f2937;
  color: #f9fafb;
  border-radius: 0.5rem;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  overflow-x: auto;
  white-space: pre-wrap;
  max-height: 300px;
}

.icon-button {
  color: #6b7280;
  padding: 0.4rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background-color: #f3f4f6;
  color: #2563eb;
}

.registry-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  table-layout: fixed;
}

.registry-table th {
  position: sticky;
  top: 0;
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  z-index: 10;
}

.registry-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.registry-table tr:hover {
  background-color: #f9fafb;
}

.registry-table tr.is-modified {
  background-color: #eff6ff;
}

.col-status {
  width: 40px;
  text-align: center;
}
.col-method {
  width: 100px;
}
.col-info {
  width: auto;
}
.col-scenario {
  width: 280px;
}
.col-delay {
  width: 120px;
}
.col-actions {
  width: 90px;
  text-align: right;
}

.handler-delay-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.handler-delay-input {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}

.ms-label {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}
.modified-indicator {
  color: #2563eb;
  font-size: 2rem;
  line-height: 0;
}

.method-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
  display: inline-block;
}

.method-badge.get {
  background-color: #dcfce7;
  color: #166534;
}
.method-badge.post {
  background-color: #fef9c3;
  color: #854d0e;
}
.method-badge.put {
  background-color: #dbeafe;
  color: #1e40af;
}
.method-badge.patch {
  background-color: #f3e8ff;
  color: #6b21a8;
}
.method-badge.delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.handler-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.url-wrapper {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.key-text {
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scenario-select {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  font-size: 0.875rem;
  color: #111827;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.scenario-select.is-modified {
  border-color: #2563eb;
  background-color: #f0f7ff;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: #9ca3af;
  font-style: italic;
}

.json-search-bar {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed #e5e7eb;
}

.json-search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.25rem 0.75rem;
  transition: all 0.2s;
}

.json-search-container:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}

.json-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.75rem;
  padding: 0.25rem 0;
  color: #111827;
}

.search-icon {
  color: #9ca3af;
}

.json-help-icon {
  background: none;
  border: none;
  padding: 0.25rem;
  color: #9ca3af;
  cursor: help;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  border-radius: 0.25rem;
}

.json-help-icon:hover {
  color: #6b7280;
  background-color: #f3f4f6;
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

.clear-json-search {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-json-search:hover {
  color: #111827;
}
</style>
