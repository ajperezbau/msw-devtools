<template>
  <MswToggle v-model="isOpen" />

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
          <MswButton
            type="button"
            variant="ghost"
            size="sm"
            @click="activeTab = 'registry'"
            class="tab-button"
            :class="{ active: activeTab === 'registry' }"
          >
            Registry
          </MswButton>
          <MswButton
            type="button"
            variant="ghost"
            size="sm"
            @click="activeTab = 'presets'"
            class="tab-button"
            :class="{ active: activeTab === 'presets' }"
          >
            Presets
          </MswButton>
          <MswButton
            type="button"
            variant="ghost"
            size="sm"
            @click="activeTab = 'log'"
            class="tab-button"
            :class="{ active: activeTab === 'log' }"
          >
            Activity Log ({{ activityLog.length }})
          </MswButton>
        </div>
        <div class="panel-actions">
          <MswButton
            type="button"
            variant="icon"
            @click="toggleTheme"
            class="theme-toggle-button"
            :title="
              theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'
            "
          >
            <svg
              v-if="theme === 'light'"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          </MswButton>
          <div class="button-group">
            <MswButton
              type="button"
              variant="icon"
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
            </MswButton>
            <MswButton
              type="button"
              variant="icon"
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
            </MswButton>
            <MswButton
              v-if="activeTab === 'registry'"
              type="button"
              variant="icon"
              @click="registryViewRef?.toggleSelectionMode()"
              class="import-button"
              :class="{ active: registryViewRef?.isSelectionMode }"
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
            </MswButton>
          </div>
          <MswButton
            v-if="activeTab === 'log'"
            type="button"
            @click="clearActivityLog"
            title="Clear log"
          >
            Clear Log
          </MswButton>
          <input
            type="file"
            ref="importFile"
            style="display: none"
            accept=".json"
            @change="handleImport"
          />
          <div class="reset-menu-container" ref="resetMenuContainer">
            <MswButton
              type="button"
              @click="showResetMenu = !showResetMenu"
              class="reset-button"
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
            </MswButton>
            <div v-if="showResetMenu" class="reset-dropdown">
              <MswButton
                type="button"
                variant="ghost"
                @click="resetScenariosOnly"
              >
                Reset Scenarios Only
              </MswButton>
              <MswButton
                type="button"
                variant="ghost"
                @click="clearConfigs"
                class="danger"
              >
                Reset All (Full)
              </MswButton>
            </div>
          </div>
          <MswButton
            type="button"
            variant="primary"
            @click="reloadPage"
            class="reload-button"
            title="Apply & Reload (Ctrl + Enter)"
          >
            Apply & Reload
          </MswButton>
          <MswButton
            type="button"
            variant="icon"
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
          </MswButton>
        </div>
      </div>

      <RegistryView
        v-if="activeTab === 'registry'"
        ref="registryViewRef"
        @open-override="openOverrideEditor"
        @view-log="viewLogForKey"
        @preset-created="activeTab = 'presets'"
      />

      <ExportOptionsModal
        v-if="showExportDialog"
        v-model:options="exportOptions"
        @close="showExportDialog = false"
        @export="exportScenarios"
      />

      <OverrideEditor
        v-if="editingOverrideKey"
        :editing-key="editingOverrideKey"
        :initial-data="initialOverrideData"
        @close="editingOverrideKey = null"
      />

      <PresetsView v-if="activeTab === 'presets'" />

      <ActivityLogView
        v-if="activeTab === 'log'"
        v-model:filterKey="logFilterKey"
        @open-override="openOverrideEditorFromLog"
        @view-handler="viewHandlerForKey"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import MswButton from "./components/MswButton.vue";
import MswToggle from "./components/MswToggle.vue";
import RegistryView from "./components/RegistryView.vue";
import PresetsView from "./components/PresetsView.vue";
import ActivityLogView from "./components/ActivityLogView.vue";
import OverrideEditor from "./components/OverrideEditor.vue";
import ExportOptionsModal from "./components/ExportOptionsModal.vue";
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
} from "./mswRegistry";
import type { ExportOptions, LogEntry } from "./types";

const isOpen = ref(false);
const activeTab = ref<"registry" | "log" | "presets">("registry");
const registryViewRef = ref<any>(null);
const resetMenuContainer = ref<HTMLElement | null>(null);

const theme = ref<"light" | "dark">(
  (localStorage.getItem("msw-devtools-theme") as "light" | "dark") || "dark",
);

const showExportDialog = ref(false);
const exportOptions = ref<ExportOptions>({
  scenarios: true,
  delays: true,
  overrides: true,
  customScenarios: true,
  customPresets: true,
  globalDelay: true,
});

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("msw-devtools-theme", theme.value);
};

const logFilterKey = ref<string | null>(null);

const editingOverrideKey = ref<string | null>(null);
const initialOverrideData = ref<{ body: string; status: number } | null>(null);

const openOverrideEditor = (key: string) => {
  initialOverrideData.value = null; // Clear previous log data if any
  editingOverrideKey.value = key;
};

const openOverrideEditorFromLog = (entry: LogEntry) => {
  initialOverrideData.value = {
    body: formatBody(entry.responseBody),
    status: entry.status,
  };
  editingOverrideKey.value = entry.key;
};

const viewLogForKey = (key: string) => {
  logFilterKey.value = key;
  activeTab.value = "log";
};

const viewHandlerForKey = (_key: string) => {
  activeTab.value = "registry";
};

const formatBody = (body: unknown) => {
  if (body === undefined || body === null) return "";
  if (typeof body === "string") return body;
  return JSON.stringify(body, null, 2);
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

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  document.addEventListener("click", handleOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("click", handleOutsideClick);
});

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
    // focusSearch(); // Logic moved to child
  }
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
  --method-all-bg: #ffedd5;
  --method-all-text: #9a3412;
  --method-all-border: #fed7aa;
  --method-get-bg: #dcfce7;
  --method-get-text: #166534;
  --method-get-border: #bbf7d0;
  --method-post-bg: #fef9c3;
  --method-post-text: #854d0e;
  --method-post-border: #fef08a;
  --method-put-bg: #dbeafe;
  --method-put-text: #1e40af;
  --method-put-border: #bfdbfe;
  --method-patch-bg: #f3e8ff;
  --method-patch-text: #6b21a8;
  --method-patch-border: #e9d5ff;
  --method-delete-bg: #fee2e2;
  --method-delete-text: #991b1b;
  --method-delete-border: #fecaca;
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
  --method-all-bg: rgba(255, 106, 51, 0.15);
  --method-all-text: #ff6a33;
  --method-all-border: rgba(255, 106, 51, 0.4);
  --method-get-bg: rgba(34, 197, 94, 0.2);
  --method-get-text: #4ade80;
  --method-get-border: rgba(34, 197, 94, 0.4);
  --method-post-bg: rgba(234, 179, 8, 0.2);
  --method-post-text: #facc15;
  --method-post-border: rgba(234, 179, 8, 0.4);
  --method-put-bg: rgba(59, 130, 246, 0.2);
  --method-put-text: #60a5fa;
  --method-put-border: rgba(59, 130, 246, 0.4);
  --method-patch-bg: rgba(168, 85, 247, 0.2);
  --method-patch-text: #c084fc;
  --method-patch-border: rgba(168, 85, 247, 0.4);
  --method-delete-bg: rgba(239, 68, 68, 0.2);
  --method-delete-text: #f87171;
  --method-delete-border: rgba(239, 68, 68, 0.4);
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
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  user-select: none;
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
  background-color: var(--bg-secondary);
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

.tab-button.msw-button {
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

.tab-button.msw-button:hover {
  background-color: var(--bg-secondary);
  color: var(--text-main);
}

.tab-button.msw-button.active {
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

.button-group {
  display: flex;
  align-items: center;
}

.button-group .msw-button {
  border-radius: 0;
  margin-left: -1px;
  position: relative;
}

.button-group .msw-button:first-child {
  border-top-left-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
  margin-left: 0;
}

.button-group .msw-button:last-child {
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

.button-group .msw-button.active {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
  z-index: 2;
}

.button-group .msw-button:hover {
  z-index: 2;
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

.reset-dropdown .msw-button {
  width: 100%;
  justify-content: flex-start;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: 0;
  border-radius: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.reset-dropdown .msw-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--accent-color);
}

.reset-dropdown .msw-button.danger {
  color: #ef4444;
  border-top: 1px solid var(--border-color);
}

.reset-dropdown .msw-button.danger:hover {
  background-color: #fef2f2;
}

.theme-dark .reset-dropdown .msw-button.danger:hover {
  background-color: #450a0a;
}

.reset-button.msw-button.menu-open {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.transition-transform {
  transition: transform 0.2s;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
