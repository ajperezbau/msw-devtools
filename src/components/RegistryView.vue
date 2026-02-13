<template>
  <div class="search-container">
    <div class="search-wrapper">
      <MswInput
        v-model="searchQuery"
        type="text"
        placeholder="Filter by key, URL or method..."
        class="search-input"
      />
      <MswButton
        v-if="searchQuery"
        type="button"
        variant="icon"
        size="sm"
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
      </MswButton>
    </div>
    <div class="modified-filter">
      <MswCheckbox v-model="showOnlyModified"> Modified only </MswCheckbox>
    </div>
    <div class="global-delay-control">
      <label for="global-delay">Global Delay:</label>
      <div class="global-delay-inputs">
        <input
          id="global-delay"
          type="range"
          v-model.number="globalDelay"
          min="0"
          max="5000"
          step="100"
          class="delay-slider"
        />
        <div class="global-delay-number-wrapper">
          <input
            type="number"
            v-model.number="globalDelay"
            min="0"
            max="10000"
            step="50"
            placeholder="0"
            class="handler-delay-input"
            aria-label="Global delay in milliseconds"
          />
          <span class="ms-label">ms</span>
        </div>
      </div>
    </div>
  </div>

  <div v-if="isSelectionMode" class="selection-toolbar">
    <div class="selection-info">
      <span class="selection-count"
        >{{ selectedKeys.size }} handlers selected</span
      >
      <MswButton
        type="button"
        variant="ghost"
        size="sm"
        @click="selectAllVisible"
        class="text-button"
      >
        Select Visible
      </MswButton>
      <MswButton
        type="button"
        variant="ghost"
        size="sm"
        @click="clearSelection"
        class="text-button"
      >
        Clear
      </MswButton>
    </div>
    <div class="selection-actions">
      <MswInput
        v-model="newPresetName"
        placeholder="Preset name..."
        variant="inline"
        size="sm"
        class="toolbar-input"
        @keyup.enter="saveCurrentAsPreset"
      />
      <MswButton
        type="button"
        size="sm"
        @click="saveCurrentAsPreset"
        :disabled="!newPresetName || selectedKeys.size === 0"
        class="toolbar-save-button"
      >
        Save Selected
      </MswButton>
    </div>
  </div>

  <div class="registry-container">
    <table class="registry-table">
      <thead>
        <tr>
          <th v-if="isSelectionMode" class="col-selection">
            <MswCheckbox v-model="isAllSelected" />
          </th>
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
          :class="{
            'is-modified': isModified(key),
            'is-selected': isSelectionMode && selectedKeys.has(key),
          }"
          @click="isSelectionMode ? toggleKeySelection(key) : null"
        >
          <td v-if="isSelectionMode" class="col-selection">
            <MswCheckbox
              :modelValue="selectedKeys.has(key)"
              @update:modelValue="toggleKeySelection(key)"
              @click.stop
            />
          </td>
          <td class="col-status">
            <div class="status-indicators">
              <span
                v-if="scenarioRegistry[key]?.isNative"
                class="native-indicator"
                title="Native MSW handler (originally in setupWorker)"
              >
                N
              </span>
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
              ></span>
            </div>
          </td>
          <td class="col-method">
            <MswBadge
              v-if="scenarioRegistry[key]"
              variant="method"
              :label="scenarioRegistry[key].method"
            />
          </td>
          <td class="col-info">
            <div class="handler-info" v-if="scenarioRegistry[key]">
              <span class="key-text">{{ displayKey(key) }}</span>
              <div
                v-if="scenarioRegistry[key].url !== key"
                class="url-wrapper"
                :title="scenarioRegistry[key].url"
              >
                {{ scenarioRegistry[key].url }}
              </div>
            </div>
          </td>
          <td class="col-scenario">
            <select
              v-model="scenarioState[key]"
              class="scenario-select"
              :class="{ 'is-modified': isModified(key) }"
              @click.stop
            >
              <option
                v-for="scenario in scenarioRegistry[key]?.scenarios"
                :key="scenario"
                :value="scenario"
              >
                {{ scenario }}{{ isCustomScenario(key, scenario) ? " ✨" : "" }}
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
                @click.stop
              />
              <span class="ms-label">ms</span>
            </div>
          </td>
          <td class="col-actions">
            <div class="action-buttons">
              <MswButton
                type="button"
                variant="icon"
                size="sm"
                @click.stop="emit('open-override', key)"
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
              </MswButton>
              <MswButton
                type="button"
                variant="icon"
                size="sm"
                @click.stop="emit('view-log', key)"
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
              </MswButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import MswBadge from "./MswBadge.vue";
import MswButton from "./MswButton.vue";
import MswCheckbox from "./MswCheckbox.vue";
import MswInput from "./MswInput.vue";
import {
  scenarioRegistry,
  scenarioState,
  handlerDelays,
  customOverrides,
  customScenarios,
  customPresets,
  globalDelay,
} from "../mswRegistry";

const emit = defineEmits<{
  (e: "open-override", key: string): void;
  (e: "view-log", key: string): void;
  (e: "preset-created"): void;
}>();

const searchQuery = ref(localStorage.getItem("msw-scenarios-filter") || "");
const showOnlyModified = ref(
  localStorage.getItem("msw-show-only-modified") === "true",
);

const isSelectionMode = ref(false);
const selectedKeys = ref(new Set<string>());
const newPresetName = ref("");

const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value;
  if (!isSelectionMode.value) {
    selectedKeys.value.clear();
  }
};

// Expose to parent
defineExpose({
  toggleSelectionMode,
  isSelectionMode,
});

const isAllSelected = computed({
  get: () => {
    if (filteredRegistryKeys.value.length === 0) return false;
    return filteredRegistryKeys.value.every((key) =>
      selectedKeys.value.has(key),
    );
  },
  set: (val) => {
    if (val) {
      filteredRegistryKeys.value.forEach((key) => selectedKeys.value.add(key));
    } else {
      filteredRegistryKeys.value.forEach((key) =>
        selectedKeys.value.delete(key),
      );
    }
  },
});

const isModified = (key: string) => {
  const handler = scenarioRegistry[key];
  const defaultScenario = handler?.isNative ? "original" : "default";

  const scenarioModified =
    scenarioState[key] && scenarioState[key] !== defaultScenario;
  const delayModified = (handlerDelays[key] || 0) > 0;
  const hasOverride = customOverrides[key]?.enabled;
  return scenarioModified || delayModified || hasOverride;
};

const isCustomScenario = (key: string, scenario: string) => {
  return !!customScenarios[key]?.[scenario];
};

const displayKey = (key: string) => {
  const handler = scenarioRegistry[key];
  if (handler?.isNative) {
    return key.replace(/^\[[A-Z]+\]\s+/, "");
  }
  return key;
};

const toggleKeySelection = (key: string) => {
  if (selectedKeys.value.has(key)) {
    selectedKeys.value.delete(key);
  } else {
    selectedKeys.value.add(key);
  }
};

const selectAllVisible = () => {
  filteredRegistryKeys.value.forEach((key) => selectedKeys.value.add(key));
};

const clearSelection = () => {
  selectedKeys.value.clear();
};

const saveCurrentAsPreset = () => {
  if (!newPresetName.value.trim()) return;

  const scenarios: Record<string, string> = {};

  let keysToInclude: string[];
  if (isSelectionMode.value && selectedKeys.value.size > 0) {
    keysToInclude = Array.from(selectedKeys.value);
  } else {
    keysToInclude = Object.keys(scenarioRegistry);
  }

  keysToInclude.forEach((key) => {
    const val = scenarioState[key];
    if (val) {
      scenarios[key] = val;
    }
  });

  const name = newPresetName.value.trim();
  const existingIndex = customPresets.findIndex((p) => p.name === name);

  if (existingIndex !== -1) {
    customPresets[existingIndex] = {
      name,
      scenarios,
    };
  } else {
    customPresets.push({
      name,
      scenarios,
    });
  }

  newPresetName.value = "";
  isSelectionMode.value = false;
  selectedKeys.value.clear();

  emit("preset-created");
};

const filteredRegistryKeys = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return Object.keys(scenarioRegistry).filter((key) => {
    const metadata = scenarioRegistry[key];
    if (!metadata) return false;

    if (showOnlyModified.value && !isModified(key)) {
      return false;
    }

    return (
      key.toLowerCase().includes(query) ||
      metadata.url.toLowerCase().includes(query) ||
      metadata.method.toLowerCase().includes(query)
    );
  });
});

watch(searchQuery, (newFilter) => {
  localStorage.setItem("msw-scenarios-filter", newFilter);
});

watch(showOnlyModified, (newValue) => {
  localStorage.setItem("msw-show-only-modified", String(newValue));
});
</script>

<style scoped>
.search-container {
  padding: 1rem 1.5rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
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

.search-input.msw-input {
  padding-right: 2.5rem;
  font-size: 1rem;
}

.clear-search-button.msw-button {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: auto;
  height: auto;
}

.clear-search-button.msw-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
}

.modified-filter {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.global-delay-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 400px;
  flex-shrink: 0;
  background-color: var(--bg-secondary);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.global-delay-control label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  white-space: nowrap;
}

.global-delay-inputs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.delay-slider {
  flex: 1;
  cursor: pointer;
  accent-color: var(--accent-color);
}

.global-delay-number-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 110px;
  flex-shrink: 0;
}

.handler-delay-input {
  width: 100%;
  padding: 0.4rem 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  background-color: var(--input-bg);
  color: var(--text-main);
  transition: all 0.2s;
}

.handler-delay-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.ms-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.selection-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--accent-color);
  color: white;
  margin: 0.5rem 1rem 0;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selection-count {
  font-weight: 600;
}

.text-button.msw-button {
  background: transparent;
  border: none;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  opacity: 0.9;
}

.text-button.msw-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  opacity: 1;
}

.text-button.msw-button:active {
  background: rgba(255, 255, 255, 0.3) !important;
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toolbar-input.msw-input {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  color: white !important;
  font-size: 0.8125rem;
  outline: none;
  width: 180px;
  transition: all 0.2s;
}

.toolbar-input.msw-input:focus {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.toolbar-input.msw-input::placeholder {
  color: rgba(255, 255, 255, 0.6) !important;
}

.toolbar-save-button.msw-button {
  background: white;
  color: var(--accent-color);
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.8125rem;
  transition: all 0.2s;
}

.toolbar-save-button.msw-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.toolbar-save-button.msw-button:active:not(:disabled) {
  transform: translateY(0);
}

.toolbar-save-button.msw-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.registry-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background-color: var(--bg-main);
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
  background-color: var(--table-header-bg);
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-color);
  z-index: 10;
}

.registry-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.registry-table tr:hover {
  background-color: var(--table-hover);
}

.registry-table tr.is-modified {
  background-color: var(--accent-soft);
}

.registry-table tr.is-selected {
  background-color: var(--bg-tertiary) !important;
}

.registry-table tr.is-selected td {
  border-bottom-color: var(--accent-color);
}

.col-selection {
  width: 40px;
  text-align: center;
}

.col-status {
  width: 50px;
  text-align: center;
}

.status-indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.native-indicator {
  font-size: 0.65rem;
  font-weight: 900;
  color: var(--text-tertiary);
  background-color: var(--bg-tertiary);
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.override-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #fbbf24;
  color: #1a1a1a;
  font-size: 10px;
  font-weight: 800;
  border-radius: 4px;
}

.modified-indicator {
  width: 10px;
  height: 10px;
  background-color: var(--accent-color);
  border-radius: 9999px;
  display: inline-block;
  flex-shrink: 0;
}

.col-method {
  width: 100px;
}

.col-info {
  width: auto;
}

.handler-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.key-text {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.url-wrapper {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-scenario {
  width: 280px;
}

.scenario-select {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  padding: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-main);
  background-color: var(--input-bg);
  cursor: pointer;
  transition: all 0.2s;
}

.scenario-select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.scenario-select.is-modified {
  border-color: var(--accent-color);
  background-color: var(--accent-soft);
  font-weight: 600;
}

.col-delay {
  width: 120px;
}

.handler-delay-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.col-actions {
  width: 90px;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.icon-button.has-override {
  color: #fbbf24;
  background-color: rgba(251, 191, 36, 0.1);
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-tertiary);
  font-style: italic;
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
</style>
