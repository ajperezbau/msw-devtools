<template>
  <div
    class="scenario-selector-overlay"
    :style="{
      left: position.x + 'px',
      top: position.y + 'px',
      bottom: 'auto',
      right: 'auto',
    }"
  >
    <button
      type="button"
      @mousedown="startDrag"
      @touchstart="startDrag"
      @click="toggleDevtools"
      class="toggle-button"
      title="MSW Devtools (Ctrl + Shift + M)"
      aria-label="Toggle MSW DevTools"
      :class="{ 'is-dragging': isDragging }"
    >
      <MswLogoIcon />
    </button>

    <div v-if="isOpen" class="modal-backdrop" @click.self="isOpen = false">
      <div
        class="modal-content"
        :class="'theme-' + theme"
        role="dialog"
        aria-modal="true"
        aria-labelledby="msw-devtools-title"
      >
        <div class="panel-header">
          <h2 id="msw-devtools-title" class="panel-title">MSW Devtools</h2>
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
              @click="activeTab = 'presets'"
              class="tab-button"
              :class="{ active: activeTab === 'presets' }"
            >
              Presets
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
              type="button"
              @click="toggleTheme"
              class="theme-toggle-button"
              :title="
                theme === 'light'
                  ? 'Switch to Dark Mode'
                  : 'Switch to Light Mode'
              "
            >
              <MoonIcon v-if="theme === 'light'" class="h-5 w-5" />
              <SunIcon v-else class="h-5 w-5" />
            </button>
            <div class="button-group">
              <button
                type="button"
                @click="showExportDialog = true"
                class="export-button"
                title="Export scenarios to JSON"
                aria-label="Export Scenarios"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </button>
              <button
                type="button"
                @click="triggerImport"
                class="import-button"
                title="Import scenarios from JSON"
                aria-label="Import Scenarios"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>
              <button
                type="button"
                @click="toggleSelectionMode"
                class="import-button"
                :class="{ active: isSelectionMode }"
                title="Select handlers to create a preset"
                aria-label="Create Preset"
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
            <button
              v-if="activeTab === 'log'"
              type="button"
              @click="clearActivityLog"
              class="clear-button"
              title="Clear log"
            >
              Clear Log
            </button>
            <input
              type="file"
              ref="importFile"
              style="display: none"
              accept=".json"
              @change="handleImport"
            />
            <div class="reset-menu-container" ref="resetMenuContainer">
              <button
                type="button"
                @click="showResetMenu = !showResetMenu"
                class="clear-button reset-button"
                :class="{ 'menu-open': showResetMenu }"
                title="Reset options"
              >
                Reset
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 ml-2 transition-transform"
                  :class="{ 'rotate-180': showResetMenu }"
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
              </button>
              <div v-if="showResetMenu" class="reset-dropdown">
                <button type="button" @click="resetScenariosOnly">
                  Reset Scenarios Only
                </button>
                <button type="button" @click="clearConfigs" class="danger">
                  Reset All (Full)
                </button>
              </div>
            </div>
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

        <RegistryView
          v-show="activeTab === 'registry'"
          ref="registryView"
          v-model:searchQuery="searchQuery"
          v-model:showOnlyModified="showOnlyModified"
          :isSelectionMode="isSelectionMode"
          @openOverrideEditor="openOverrideEditor"
          @viewLogs="viewLogForKey"
          @savePreset="handleSavePreset"
        />

        <!-- Export Options Dialog -->
        <div v-if="showExportDialog" class="override-editor-overlay">
          <div class="override-editor-content">
            <div class="editor-header">
              <h3>Export Options</h3>
              <button
                type="button"
                @click="showExportDialog = false"
                class="close-button"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div class="editor-body">
              <p style="margin-bottom: 1rem; color: var(--text-secondary)">
                Select what you want to include in the export:
              </p>
              <div class="export-options-list">
                <MswCheckbox
                  v-model="allOptionsSelected"
                  :label-style="{
                    marginBottom: '1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border-color)',
                  }"
                >
                  <span style="font-weight: 700">Select All</span>
                </MswCheckbox>
                <MswCheckbox
                  v-model="exportOptions.scenarios"
                  :label-style="{ marginBottom: '0.75rem' }"
                >
                  Active Scenarios Selection
                </MswCheckbox>
                <MswCheckbox
                  v-model="exportOptions.customScenarios"
                  :label-style="{ marginBottom: '0.75rem' }"
                >
                  Custom Handlers (JSON scenarios)
                </MswCheckbox>
                <MswCheckbox
                  v-model="exportOptions.customPresets"
                  :label-style="{ marginBottom: '0.75rem' }"
                >
                  Custom Presets (Recipes)
                </MswCheckbox>
                <MswCheckbox
                  v-model="exportOptions.overrides"
                  :label-style="{ marginBottom: '0.75rem' }"
                >
                  Manual Overrides
                </MswCheckbox>
                <MswCheckbox
                  v-model="exportOptions.delays"
                  :label-style="{ marginBottom: '0.75rem' }"
                >
                  Handler Delays
                </MswCheckbox>
                <MswCheckbox
                  v-model="exportOptions.globalDelay"
                  :label-style="{ marginBottom: '0.75rem' }"
                >
                  Global Delay Settings
                </MswCheckbox>
              </div>
            </div>
            <div class="editor-footer">
              <button
                type="button"
                @click="showExportDialog = false"
                class="secondary-button"
              >
                Cancel
              </button>
              <div class="spacer"></div>
              <button
                type="button"
                @click="exportScenarios"
                class="primary-button"
                :disabled="Object.values(exportOptions).every((v) => !v)"
              >
                Download JSON
              </button>
            </div>
          </div>
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
                <label>Scenario Name (Optional)</label>
                <div class="input-subtitle">
                  If provided, this will be saved as a reusable scenario and
                  automatically selected.
                </div>
                <input
                  type="text"
                  v-model="overrideForm.scenarioName"
                  class="scenario-name-input"
                  placeholder="e.g. Empty Results, Error Page..."
                />
              </div>
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
                v-if="editingOverrideKey"
              >
                Clear Current Override
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
                {{
                  overrideForm.scenarioName
                    ? "Save as Scenario"
                    : "Save & Enable Override"
                }}
              </button>
            </div>
          </div>
        </div>

        <PresetsView v-if="activeTab === 'presets'" />

        <ActivityLogView
          v-if="activeTab === 'log'"
          :filterKey="logFilterKey"
          @update:filterKey="logFilterKey = $event"
          @viewInRegistry="viewHandlerForKey"
          @useAsOverride="openOverrideEditorFromLog"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import MswCheckbox from "./components/MswCheckbox.vue";
import PresetsView from "./components/views/PresetsView.vue";
import ActivityLogView from "./components/views/ActivityLogView.vue";
import RegistryView from "./components/views/RegistryView.vue";
import MswLogoIcon from "./assets/icons/MswLogoIcon.vue";
import MoonIcon from "./assets/icons/MoonIcon.vue";
import SunIcon from "./assets/icons/SunIcon.vue";
import {
  activityLog,
  clearActivityLog,
  customOverrides,
  customPresets,
  customScenarios,
  globalDelay,
  handlerDelays,
  scenarioRegistry,
  scenarioState,
  type LogEntry,
} from "./mswRegistry";

const isOpen = ref(false);
const activeTab = ref<"registry" | "log" | "presets">("registry");
const searchQuery = ref(localStorage.getItem("msw-scenarios-filter") || "");
const resetMenuContainer = ref<HTMLElement | null>(null);

const theme = ref<"light" | "dark">(
  (localStorage.getItem("msw-devtools-theme") as "light" | "dark") || "dark",
);

const isSelectionMode = ref(false);
const selectedKeys = ref(new Set<string>());

const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value;
  if (!isSelectionMode.value) {
    selectedKeys.value.clear();
  }
};

const showExportDialog = ref(false);
const exportOptions = ref({
  scenarios: true,
  delays: true,
  overrides: true,
  customScenarios: true,
  customPresets: true,
  globalDelay: true,
});

const allOptionsSelected = computed({
  get: () => Object.values(exportOptions.value).every((v) => v),
  set: (value) => {
    Object.keys(exportOptions.value).forEach((key) => {
      (exportOptions.value as any)[key] = value;
    });
  },
});

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("msw-devtools-theme", theme.value);
};

const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const hasMoved = ref(false);

const startDrag = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true;
  hasMoved.value = false;

  let clientX: number;
  let clientY: number;

  if ("touches" in e) {
    const touch = e.touches[0];
    if (!touch) return;
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  dragStart.value = {
    x: clientX - position.value.x,
    y: clientY - position.value.y,
  };

  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", endDrag);
  window.addEventListener("touchmove", onDrag, { passive: false });
  window.addEventListener("touchend", endDrag);
};

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;

  let clientX: number;
  let clientY: number;

  if ("touches" in e) {
    const touch = e.touches[0];
    if (!touch) return;
    clientX = touch.clientX;
    clientY = touch.clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  const newX = clientX - dragStart.value.x;
  const newY = clientY - dragStart.value.y;

  // Small threshold to avoid accidental drags when clicking
  if (
    !hasMoved.value &&
    Math.abs(newX - position.value.x) < 5 &&
    Math.abs(newY - position.value.y) < 5
  ) {
    return;
  }

  hasMoved.value = true;

  // Constrain position to viewport
  const padding = 10;
  const buttonSize = 60; // Approximate size of the button
  position.value = {
    x: Math.max(
      padding,
      Math.min(window.innerWidth - buttonSize - padding, newX),
    ),
    y: Math.max(
      padding,
      Math.min(window.innerHeight - buttonSize - padding, newY),
    ),
  };
};

const endDrag = () => {
  if (isDragging.value) {
    isDragging.value = false;
    localStorage.setItem("msw-devtools-x", String(position.value.x));
    localStorage.setItem("msw-devtools-y", String(position.value.y));
  }

  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", endDrag);
  window.removeEventListener("touchmove", onDrag);
  window.removeEventListener("touchend", endDrag);
};

const toggleDevtools = () => {
  if (!hasMoved.value) {
    isOpen.value = !isOpen.value;
  }
};

const showOnlyModified = ref(
  localStorage.getItem("msw-show-only-modified") === "true",
);
const registryView = ref<InstanceType<typeof RegistryView> | null>(null);
const logFilterKey = ref<string | null>(null);

const handleSavePreset = (name: string, keys: Set<string>) => {
  const scenarios: Record<string, string> = {};
  
  Array.from(keys).forEach((key) => {
    const val = scenarioState[key];
    if (val) {
      scenarios[key] = val;
    }
  });

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

  activeTab.value = "presets";
};

const editingOverrideKey = ref<string | null>(null);
const overrideForm = ref({
  body: "",
  status: 200,
  enabled: true,
  scenarioName: "",
});

const openOverrideEditor = (key: string) => {
  editingOverrideKey.value = key;
  const existing = customOverrides[key];
  overrideForm.value = {
    body: existing?.body ?? "",
    status: existing?.status ?? 200,
    enabled: true,
    scenarioName: "",
  };
};

const formatBody = (body: unknown) => {
  if (body === undefined || body === null) return "";
  if (typeof body === "string") return body;
  return JSON.stringify(body, null, 2);
};

const openOverrideEditorFromLog = (entry: LogEntry) => {
  editingOverrideKey.value = entry.key;
  overrideForm.value = {
    body: formatBody(entry.responseBody),
    status: entry.status,
    enabled: true,
    scenarioName: "",
  };
};

const saveOverride = () => {
  if (editingOverrideKey.value) {
    const key = editingOverrideKey.value;
    const { scenarioName, ...formData } = overrideForm.value;

    if (scenarioName.trim()) {
      // Save as reusable scenario
      if (!customScenarios[key]) {
        customScenarios[key] = {};
      }

      customScenarios[key][scenarioName] = {
        body: formData.body,
        status: formData.status,
      };

      // Update registry information
      if (
        scenarioRegistry[key] &&
        !scenarioRegistry[key].scenarios.includes(scenarioName)
      ) {
        scenarioRegistry[key].scenarios.push(scenarioName);
      }

      // Automatically select the new scenario and remove any existing manual override
      scenarioState[key] = scenarioName;
      delete customOverrides[key];
    } else {
      // Regular manual override
      customOverrides[key] = formData;
    }

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

const clearOverride = () => {
  if (editingOverrideKey.value) {
    delete customOverrides[editingOverrideKey.value];
    editingOverrideKey.value = null;
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

const reloadPage = () => {
  isOpen.value = false;
  window.location.reload();
};

const handleResize = () => {
  const padding = 10;
  const buttonSize = 60;
  position.value = {
    x: Math.max(
      padding,
      Math.min(window.innerWidth - buttonSize - padding, position.value.x),
    ),
    y: Math.max(
      padding,
      Math.min(window.innerHeight - buttonSize - padding, position.value.y),
    ),
  };
};

onMounted(() => {
  const savedX = localStorage.getItem("msw-devtools-x");
  const savedY = localStorage.getItem("msw-devtools-y");

  if (savedX !== null && savedY !== null) {
    position.value = { x: Number(savedX), y: Number(savedY) };
  } else {
    position.value = {
      x: window.innerWidth - 80,
      y: window.innerHeight - 80,
    };
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", handleResize);
  document.addEventListener("click", handleOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("click", handleOutsideClick);
});

const focusSearch = async () => {
  await nextTick();
  registryView.value?.focusSearch();
};

const showResetMenu = ref(false);

const handleOutsideClick = (event: MouseEvent) => {
  if (
    showResetMenu.value &&
    resetMenuContainer.value &&
    !resetMenuContainer.value.contains(event.target as Node)
  ) {
    showResetMenu.value = false;
  }
};

const resetScenariosOnly = () => {
  Object.keys(scenarioState).forEach((key) => {
    const handler = scenarioRegistry[key];
    scenarioState[key] = handler?.isNative ? "original" : "default";
  });

  // Also clear overrides as they affects the scenario returned
  Object.keys(customOverrides).forEach((key) => {
    delete customOverrides[key];
  });

  showResetMenu.value = false;
};

const clearConfigs = () => {
  // eslint-disable-next-line no-alert
  const confirmed = window.confirm(
    "This will clear all saved scenarios, delays, overrides, and presets. Are you sure?",
  );
  if (!confirmed) {
    showResetMenu.value = false;
    return;
  }

  localStorage.removeItem("msw-scenarios");
  localStorage.removeItem("msw-delay");
  localStorage.removeItem("msw-handler-delays");
  localStorage.removeItem("msw-overrides");
  localStorage.removeItem("msw-custom-scenarios");
  localStorage.removeItem("msw-custom-presets");

  // Reset all scenarios to their appropriate default in the reactive state
  Object.keys(scenarioState).forEach((key) => {
    const handler = scenarioRegistry[key];
    scenarioState[key] = handler?.isNative ? "original" : "default";
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

  // Re-sync scenarioRegistry with original scenarios (removing custom ones)
  Object.keys(scenarioRegistry).forEach((key) => {
    const handler = scenarioRegistry[key];
    if (handler && handler.originalScenarios) {
      handler.scenarios = [...handler.originalScenarios];
    }
  });

  // Clear custom presets
  customPresets.splice(0, customPresets.length);

  // Reset global delay
  globalDelay.value = 0;

  showResetMenu.value = false;
};

const exportScenarios = () => {
  const data: any = {
    version: 1,
    timestamp: Date.now(),
  };

  if (exportOptions.value.scenarios) {
    data.scenarios = scenarioState;
  }
  if (exportOptions.value.delays) {
    data.delays = handlerDelays;
  }
  if (exportOptions.value.overrides) {
    data.overrides = customOverrides;
  }
  if (exportOptions.value.customScenarios) {
    data.customScenarios = customScenarios;
  }
  if (exportOptions.value.customPresets) {
    data.customPresets = customPresets;
  }
  if (exportOptions.value.globalDelay) {
    data.globalDelay = globalDelay.value;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `msw-scenarios-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showExportDialog.value = false;
};

const importFile = ref<HTMLInputElement | null>(null);

const triggerImport = () => {
  importFile.value?.click();
};

const handleImport = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);

      if (data.scenarios) {
        Object.keys(scenarioState).forEach((key) => {
          delete scenarioState[key];
        });
        Object.assign(scenarioState, data.scenarios);
      }
      if (data.delays) {
        Object.keys(handlerDelays).forEach((key) => {
          delete handlerDelays[key];
        });
        Object.assign(handlerDelays, data.delays);
      }
      if (data.overrides) {
        Object.keys(customOverrides).forEach((key) => {
          delete customOverrides[key];
        });
        Object.assign(customOverrides, data.overrides);
      }
      if (data.customScenarios) {
        Object.keys(customScenarios).forEach((key) => {
          delete customScenarios[key];
        });
        Object.assign(customScenarios, data.customScenarios);
      }
      if (data.customPresets && Array.isArray(data.customPresets)) {
        customPresets.splice(0, customPresets.length, ...data.customPresets);
      }
      if (data.globalDelay !== undefined) {
        globalDelay.value = data.globalDelay;
      }

      // eslint-disable-next-line no-alert
      alert(
        "Scenarios imported successfully. Page will reload to apply changes.",
      );
      reloadPage();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to import scenarios:", err);
      // eslint-disable-next-line no-alert
      alert("Failed to import scenarios. Invalid file format.");
    } finally {
      target.value = ""; // Reset input
    }
  };
  reader.readAsText(file);
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
</script>

<style scoped>
.modal-content.theme-light {
  --bg-main: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f4f4f5;
  --text-main: #09090b;
  --text-secondary: #52525b;
  --text-tertiary: #71717a;
  --border-color: #e4e4e7;
  --accent-color: #ff6a33;
  --accent-hover: #e65a2b;
  --accent-soft: rgba(255, 106, 51, 0.1);
  --input-bg: #ffffff;
  --table-hover: #fafafa;
  --table-header-bg: #fafafa;
  --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
}

.modal-content.theme-dark {
  --bg-main: #18181b;
  --bg-secondary: #27272a;
  --bg-tertiary: #3f3f46;
  --text-main: #fafafa;
  --text-secondary: #d4d4d8;
  --text-tertiary: #a1a1aa;
  --border-color: #3f3f46;
  --accent-color: #ff6a33;
  --accent-hover: #ff8559;
  --accent-soft: rgba(255, 106, 51, 0.15);
  --input-bg: #121212;
  --table-hover: #27272a;
  --table-header-bg: #18181b;
  --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

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
.ml-1 {
  margin-left: 0.25rem;
}
.ml-2 {
  margin-left: 0.5rem;
}

.scenario-selector-overlay {
  position: fixed;
  z-index: 10000;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  user-select: none;
}

.toggle-button {
  background-color: #000;
  padding: 6px;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.4),
    0 2px 4px -1px rgba(0, 0, 0, 0.2);
  border: 1px solid #27272a;
  cursor: move;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  width: 48px;
  height: 48px;
  overflow: hidden;
}

.msw-logo-svg {
  width: 100%;
  height: 100%;
}

.toggle-button.is-dragging {
  cursor: grabbing;
  transform: scale(1.1);
  opacity: 1;
  border-color: #ff6a33;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.5),
    0 10px 10px -5px rgba(0, 0, 0, 0.3);
}

.toggle-button:hover {
  border-color: #ff6a33;
  transform: scale(1.08) translateY(-2px);
  box-shadow:
    0 12px 20px -5px rgba(0, 0, 0, 0.5),
    0 4px 6px -2px rgba(0, 0, 0, 0.3);
}

.toggle-button:active {
  transform: scale(0.95);
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
  background-color: var(--bg-main);
  color: var(--text-main);
  border-radius: 1rem;
  width: 100%;
  max-width: 1600px;
  height: 95vh;
  box-shadow: var(--modal-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.modal-content * {
  scrollbar-width: thin;
  scrollbar-color: var(--bg-tertiary) transparent;
}

.modal-content *::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.modal-content *::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content *::-webkit-scrollbar-thumb {
  background-color: var(--bg-tertiary);
  border-radius: 20px;
}

.modal-content *::-webkit-scrollbar-thumb:hover {
  background-color: var(--border-color);
}

.panel-header {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  background-color: var(--bg-main);
  border-bottom: 1px solid var(--border-color);
}

.panel-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
}

.tab-buttons {
  display: flex;
  gap: 0.5rem;
  margin: 0 1.5rem;
  background-color: var(--bg-tertiary);
  padding: 0.25rem;
  border-radius: 0.75rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background-color: var(--bg-secondary);
  color: var(--text-main);
}

.tab-button.active {
  background-color: var(--bg-main);
  color: var(--accent-color);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.panel-actions {
  display: flex;
  gap: 0.75rem;
  margin-left: auto;
  align-items: center;
}

.clear-button,
.export-button,
.import-button,
.theme-toggle-button {
  background-color: var(--bg-main);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.export-button,
.import-button,
.theme-toggle-button {
  padding: 0.5rem;
  width: 2.5rem;
  height: 2.5rem;
}

.button-group {
  display: flex;
  align-items: center;
}

.button-group button {
  border-radius: 0;
  margin-left: -1px;
}

.button-group button:first-child {
  border-top-left-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
  margin-left: 0;
}

.button-group button:last-child {
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

.button-group button.active {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
  z-index: 2;
}

.clear-button:hover,
.export-button:hover,
.import-button:hover,
.theme-toggle-button:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent-color);
  color: var(--accent-color);
  z-index: 1;
}

.reload-button {
  background-color: var(--accent-color);
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
  background-color: var(--accent-hover);
}

.reset-menu-container {
  position: relative;
}

.reset-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 100;
  min-width: 180px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.reset-dropdown button {
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.reset-dropdown button:hover {
  background-color: var(--bg-tertiary);
  color: var(--accent-color);
}

.reset-dropdown button.danger {
  color: #ef4444;
  border-top: 1px solid var(--border-color);
}

.reset-dropdown button.danger:hover {
  background-color: #fef2f2;
}

.theme-dark .reset-dropdown button.danger:hover {
  background-color: #450a0a;
}

.reset-button.menu-open {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.transition-transform {
  transition: transform 0.2s;
}

.rotate-180 {
  transform: rotate(180deg);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}

.close-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
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

.selection-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toolbar-input {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 0.4rem 0.75rem;
  color: white;
  font-size: 0.875rem;
  outline: none;
}

.toolbar-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.toolbar-save-button {
  background: white;
  color: var(--accent-color);
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
}

.toolbar-save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.col-selection {
  width: 40px;
  text-align: center;
}

.registry-table tr.is-selected {
  background-color: var(--bg-tertiary) !important;
}

.registry-table tr.is-selected td {
  border-bottom-color: var(--accent-color);
}

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

.clear-search-button {
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
}

.clear-search-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
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

.global-delay-number-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 110px;
  flex-shrink: 0;
}

.delay-slider {
  flex: 1;
  cursor: pointer;
  accent-color: var(--accent-color);
}

.search-input {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-size: 1rem;
  color: var(--text-main);
  background-color: var(--input-bg);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.modified-filter {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
.modified-indicator {
  width: 10px;
  height: 10px;
  background-color: var(--accent-color);
  border-radius: 9999px;
  display: inline-block;
  flex-shrink: 0;
}

.method-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
  display: inline-block;
}

.method-badge.mini {
  font-size: 0.6rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  min-width: 32px;
  flex-shrink: 0;
}

.theme-light .method-badge.get {
  background-color: #dcfce7;
  color: #166534;
}
.theme-light .method-badge.post {
  background-color: #fef9c3;
  color: #854d0e;
}
.theme-light .method-badge.put {
  background-color: #dbeafe;
  color: #1e40af;
}
.theme-light .method-badge.patch {
  background-color: #f3e8ff;
  color: #6b21a8;
}
.theme-light .method-badge.delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.theme-dark .method-badge.get {
  background-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}
.theme-dark .method-badge.post {
  background-color: rgba(234, 179, 8, 0.2);
  color: #facc15;
}
.theme-dark .method-badge.put {
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}
.theme-dark .method-badge.patch {
  background-color: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}
.theme-dark .method-badge.delete {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
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
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.key-text {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.native-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 0.25rem;
  background-color: var(--bg-tertiary);
  color: var(--text-tertiary);
  border: 1px solid var(--border-color);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  flex-shrink: 0;
}

.native-badge.mini {
  font-size: 0.55rem;
  padding: 0.05rem 0.2rem;
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

.json-search-input {
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

.json-help-icon {
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

.json-help-icon:hover {
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

.clear-json-search {
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

.clear-json-search:hover {
  color: var(--text-main);
}
</style>
