<template>
  <div class="presets-container">
    <div v-if="allPresets.length === 0" class="empty-state">
      No presets defined. Use <code>definePresets()</code> or the "Create
      Preset" button in the Registry tab to add some.
    </div>
    <div v-else class="presets-split">
      <div class="presets-list" role="list">
        <MswButton
          v-for="preset in allPresets"
          :key="preset.key"
          type="button"
          variant="ghost"
          class="presets-list-item"
          :class="{ active: preset.key === selectedPresetName }"
          :aria-pressed="preset.key === selectedPresetName"
          @click="selectedPresetName = preset.key"
        >
          <div class="preset-list-title">
            <span class="preset-list-name" :title="preset.name">
              {{ preset.name }}
            </span>
            <span v-if="preset.isCustom" class="custom-badge"
              >User Created</span
            >
          </div>
          <div class="preset-list-meta">
            <span class="preset-count">
              {{ Object.keys(preset.scenarios).length }} handlers
            </span>
            <span
              v-if="preset.description"
              class="preset-list-desc"
              :title="preset.description"
            >
              {{ preset.description }}
            </span>
          </div>
        </MswButton>
      </div>
      <div v-if="selectedPreset" class="presets-detail">
        <div
          class="preset-detail-card"
          :class="{ 'is-custom': selectedPreset.isCustom }"
        >
          <div class="preset-info">
            <div class="preset-detail-header">
              <div class="preset-title-row">
                <div class="preset-title-main">
                  <h3 class="preset-name" :title="selectedPreset.name">
                    {{ selectedPreset.name }}
                  </h3>
                  <span v-if="selectedPreset.isCustom" class="custom-badge"
                    >User Created</span
                  >
                </div>
                <div class="preset-title-actions">
                  <MswButton
                    type="button"
                    variant="primary"
                    size="sm"
                    @click="applyPreset(selectedPreset.name)"
                    class="apply-preset-button compact"
                  >
                    Apply Preset
                  </MswButton>
                  <MswButton
                    v-if="selectedPreset.isCustom"
                    type="button"
                    variant="icon"
                    size="sm"
                    @click="deleteCustomPreset(selectedPreset.name)"
                    class="delete-preset-button"
                    title="Delete preset"
                    aria-label="Delete preset"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </MswButton>
                </div>
              </div>
              <p v-if="selectedPreset.description" class="preset-description">
                {{ selectedPreset.description }}
              </p>
            </div>
            <div class="preset-scenarios-preview">
              <span
                v-for="(scenario, hKey) in selectedPreset.scenarios"
                :key="hKey"
                class="preview-tag"
                :title="`${hKey}: ${scenario}`"
              >
                <span class="preview-line">
                  <MswBadge
                    v-if="scenarioRegistry && scenarioRegistry[hKey]"
                    variant="method"
                    :label="scenarioRegistry[hKey].method"
                    size="sm"
                  />
                  <span class="preview-scenario">{{ scenario }}</span>
                </span>
                <span class="preview-text">
                  {{ displayKey(hKey) }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="preset-empty">
        Select a preset to view its handlers.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import MswBadge from "./MswBadge.vue";
import MswButton from "./MswButton.vue";
import {
  applyPreset,
  customPresets,
  displayKey,
  presets,
  scenarioRegistry,
} from "../mswRegistry";

const selectedPresetName = ref<string | null>(null);

// Constants for preset key prefixes
const PRESET_KEY_PREFIX_CUSTOM = "custom:";
const PRESET_KEY_PREFIX_GLOBAL = "global:";

// Helper to create unique preset key
const getPresetKey = (name: string, isCustom: boolean) => {
  return isCustom
    ? `${PRESET_KEY_PREFIX_CUSTOM}${name}`
    : `${PRESET_KEY_PREFIX_GLOBAL}${name}`;
};

const allPresets = computed(() => {
  return [
    ...presets.map((p) => ({
      ...p,
      isCustom: false,
      key: getPresetKey(p.name, false),
    })),
    ...customPresets.map((p) => ({
      ...p,
      isCustom: true,
      key: getPresetKey(p.name, true),
    })),
  ];
});

const selectedPreset = computed(() => {
  if (!selectedPresetName.value) return null;
  return (
    allPresets.value.find((p) => p.key === selectedPresetName.value) || null
  );
});

watch(
  allPresets,
  (nextPresets) => {
    if (nextPresets.length === 0) {
      selectedPresetName.value = null;
      return;
    }

    if (
      !selectedPresetName.value ||
      !nextPresets.some((p) => p.key === selectedPresetName.value)
    ) {
      selectedPresetName.value = nextPresets[0]?.key ?? null;
    }
  },
  { immediate: true },
);

const deleteCustomPreset = (name: string) => {
  const index = customPresets.findIndex((p) => p.name === name);
  if (index !== -1) {
    customPresets.splice(index, 1);
  }
};
</script>

<style scoped>
.presets-container {
  padding: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.presets-split {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 0;
  align-items: stretch;
  flex: 1;
  min-height: 0;
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding: 1.5rem;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
}

.presets-list-item {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-main);
  padding: 0.85rem 0.9rem;
  text-align: left;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
}

.presets-list-item.msw-button {
  display: flex;
  width: 100%;
  gap: 0.35rem;
  padding: 0.85rem 0.9rem;
  justify-content: flex-start;
  align-items: stretch;
  text-align: left;
}

.presets-list-item:hover {
  border-color: var(--accent-color);
  color: var(--text-main);
  background: var(--bg-tertiary);
}

.presets-list-item.active {
  border-color: var(--accent-color);
  background: var(--bg-tertiary);
  box-shadow: inset 0 0 0 1px var(--accent-color);
  color: var(--text-main);
}

.preset-list-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preset-list-name {
  font-weight: 700;
  color: var(--text-main);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-badge {
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

.preset-list-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.preset-count {
  font-weight: 600;
  color: var(--text-secondary);
}

.preset-list-desc {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.presets-detail {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 1.5rem 1.5rem 1.5rem;
  background-color: var(--bg-main);
  overflow-y: auto;
}

.preset-detail-header {
  position: sticky;
  top: 0;
  background-color: var(--bg-main);
  padding-top: 1.5rem;
  z-index: 10;
}

.preset-detail-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: transparent;
  border: none;
  padding: 0;
}

.preset-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.preset-title-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.preset-name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-title-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.preset-description {
  margin: 0 0 1.5rem 0;
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.preset-scenarios-preview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 2rem;
}

.preview-tag {
  font-size: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  transition: all 0.2s ease;
}

.preview-tag:hover {
  background: var(--bg-main);
  border-color: var(--accent-soft);
}

.preview-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.preview-scenario {
  font-weight: 700;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-text {
  display: block;
  width: 100%;
  color: var(--text-tertiary);
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  overflow-wrap: anywhere;
  word-break: break-all;
}

.apply-preset-button.msw-button {
  background-color: var(--accent-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.apply-preset-button.msw-button:hover {
  background-color: var(--accent-hover);
}

.apply-preset-button.msw-button.compact {
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
}

.delete-preset-button.msw-button {
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.delete-preset-button.msw-button:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.theme-dark .delete-preset-button.msw-button:hover {
  background-color: #450a0a;
}

.preset-empty {
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  color: var(--text-tertiary);
  text-align: center;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-tertiary);
  font-style: italic;
}

.h-4 {
  height: 1rem;
}
.w-4 {
  width: 1rem;
}
</style>
