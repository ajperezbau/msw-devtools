<template>
  <div>
    <!-- Search and Filters -->
    <div class="search-container">
      <div class="search-wrapper">
        <input
          ref="searchInput"
          v-model="localSearchQuery"
          type="text"
          placeholder="Filter by key, URL or method..."
          class="search-input"
        />
        <button
          v-if="localSearchQuery"
          type="button"
          @click="localSearchQuery = ''"
          class="clear-search-button"
          title="Clear search"
        >
          <CloseIcon class="h-4 w-4" />
        </button>
      </div>
      <div class="modified-filter">
        <MswCheckbox v-model="localShowOnlyModified">
          Modified only
        </MswCheckbox>
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

    <!-- Selection Toolbar -->
    <div v-if="isSelectionMode" class="selection-toolbar">
      <div class="selection-info">
        <span class="selection-count"
          >{{ selectedKeys.size }} handlers selected</span
        >
        <button @click="selectAllVisible" class="text-button">
          Select Visible
        </button>
        <button @click="clearSelection" class="text-button">Clear</button>
      </div>
      <div class="selection-actions">
        <input
          v-model="newPresetName"
          placeholder="Preset name..."
          class="toolbar-input"
          @keyup.enter="handleSavePreset"
        />
        <button
          @click="handleSavePreset"
          :disabled="!newPresetName || selectedKeys.size === 0"
          class="toolbar-save-button"
        >
          Save Selected
        </button>
      </div>
    </div>

    <!-- Handler Table -->
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
            <td colspan="7" class="empty-state">
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
                  @click.stop
                />
                <span class="ms-label">ms</span>
              </div>
            </td>
            <td class="col-actions">
              <div class="action-buttons">
                <button
                  type="button"
                  @click.stop="$emit('openOverrideEditor', key)"
                  class="icon-button"
                  :class="{ 'has-override': customOverrides[key]?.enabled }"
                  title="Custom response override"
                >
                  <EditIcon class="h-5 w-5" />
                </button>
                <button
                  type="button"
                  @click.stop="$emit('viewLogs', key)"
                  class="icon-button"
                  title="View logs for this handler"
                >
                  <ClipboardIcon class="h-5 w-5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, toRefs } from "vue";
import MswCheckbox from "../MswCheckbox.vue";
import CloseIcon from "../../assets/icons/CloseIcon.vue";
import EditIcon from "../../assets/icons/EditIcon.vue";
import ClipboardIcon from "../../assets/icons/ClipboardIcon.vue";
import {
  scenarioRegistry,
  scenarioState,
  handlerDelays,
  globalDelay,
  customOverrides,
  customScenarios,
} from "../../mswRegistry";

interface Props {
  searchQuery?: string;
  showOnlyModified?: boolean;
  isSelectionMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: "",
  showOnlyModified: false,
  isSelectionMode: false,
});

// Extract isSelectionMode with toRefs for proper reactivity
const { isSelectionMode: isSelectionModeRef } = toRefs(props);
// Create an unwrapped computed for template use  
const isSelectionMode = computed(() => isSelectionModeRef.value);

const emit = defineEmits<{
  (e: "update:searchQuery", value: string): void;
  (e: "update:showOnlyModified", value: boolean): void;
  (e: "openOverrideEditor", key: string): void;
  (e: "viewLogs", key: string): void;
  (e: "savePreset", name: string, keys: Set<string>): void;
}>();

const searchInput = ref<HTMLInputElement | null>(null);
const selectedKeys = ref(new Set<string>());
const newPresetName = ref("");

const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (value) => emit("update:searchQuery", value),
});

const localShowOnlyModified = computed({
  get: () => props.showOnlyModified,
  set: (value) => emit("update:showOnlyModified", value),
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

const filteredRegistryKeys = computed(() => {
  const query = localSearchQuery.value.toLowerCase();
  return Object.keys(scenarioRegistry).filter((key) => {
    const metadata = scenarioRegistry[key];
    if (!metadata) return false;

    // Filter by modified status if enabled
    if (localShowOnlyModified.value && !isModified(key)) {
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

const isAllSelected = computed({
  get: () => {
    if (filteredRegistryKeys.value.length === 0) return false;
    return filteredRegistryKeys.value.every((key) => selectedKeys.value.has(key));
  },
  set: (val) => {
    if (val) {
      filteredRegistryKeys.value.forEach((key) => selectedKeys.value.add(key));
    } else {
      filteredRegistryKeys.value.forEach((key) => selectedKeys.value.delete(key));
    }
  },
});

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

const handleSavePreset = () => {
  if (newPresetName.value && selectedKeys.value.size > 0) {
    emit("savePreset", newPresetName.value, new Set(selectedKeys.value));
    newPresetName.value = "";
    selectedKeys.value.clear();
  }
};

// Watch for selection mode changes to clear selection
watch(isSelectionMode, (newVal) => {
  if (!newVal) {
    selectedKeys.value.clear();
  }
});

defineExpose({
  focusSearch: () => searchInput.value?.focus(),
});
</script>

<style scoped>
.search-container {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  align-items: center;
  flex-wrap: wrap;
}

.search-wrapper {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.625rem 2.5rem 0.625rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-main);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.clear-search-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
}

.modified-filter {
  display: flex;
  align-items: center;
}

.global-delay-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.global-delay-control label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.global-delay-inputs {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.delay-slider {
  width: 120px;
  height: 4px;
  border-radius: 2px;
  background: var(--bg-tertiary);
  outline: none;
  cursor: pointer;
}

.delay-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
}

.global-delay-number-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.handler-delay-input {
  width: 70px;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-main);
  text-align: right;
}

.ms-label {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.selection-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-soft);
  border-bottom: 1px solid var(--accent-color);
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selection-count {
  font-weight: 600;
  color: var(--accent-color);
}

.text-button {
  background: none;
  border: none;
  color: var(--accent-color);
  font-weight: 600;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  text-decoration: none;
  transition: opacity 0.2s;
}

.text-button:hover {
  opacity: 0.8;
}

.selection-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.toolbar-input {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  border: 1px solid var(--accent-color);
  background-color: var(--bg-main);
  color: var(--text-main);
  min-width: 200px;
}

.toolbar-save-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.375rem;
  border: none;
  background-color: var(--accent-color);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toolbar-save-button:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.toolbar-save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.registry-container {
  flex: 1;
  overflow-y: auto;
}

.registry-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  table-layout: fixed;
}

.registry-table thead {
  position: sticky;
  top: 0;
  background-color: var(--table-header-bg);
  z-index: 10;
  border-bottom: 2px solid var(--border-color);
}

.registry-table th {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.col-selection {
  width: 50px;
}

.col-status {
  width: 60px;
}

.col-method {
  width: 100px;
}

.col-info {
  width: auto;
  min-width: 200px;
}

.col-scenario {
  width: 180px;
}

.col-delay {
  width: 120px;
}

.col-actions {
  width: 120px;
}

.registry-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s;
}

.registry-table tbody tr:hover {
  background-color: var(--table-hover);
}

.registry-table tbody tr.is-modified {
  background-color: var(--accent-soft);
}

.registry-table tbody tr.is-selected {
  background-color: rgba(59, 130, 246, 0.1);
}

.registry-table td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--text-tertiary);
}

.status-indicators {
  display: flex;
  gap: 0.25rem;
}

.native-indicator,
.override-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 800;
}

.native-indicator {
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.override-indicator {
  background-color: var(--accent-soft);
  color: var(--accent-color);
}

.modified-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--accent-color);
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

.handler-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.key-text {
  font-weight: 600;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.url-wrapper {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scenario-select {
  width: 100%;
  padding: 0.375rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
}

.scenario-select:hover {
  border-color: var(--accent-color);
}

.scenario-select.is-modified {
  border-color: var(--accent-color);
  background-color: var(--accent-soft);
}

.handler-delay-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  color: var(--text-tertiary);
  padding: 0.4rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
}

.icon-button.has-override {
  color: #fbbf24;
  background-color: rgba(251, 191, 36, 0.1);
}

.h-4 {
  height: 1rem;
}
.w-4 {
  width: 1rem;
}
.h-5 {
  height: 1.25rem;
}
.w-5 {
  width: 1.25rem;
}
</style>
