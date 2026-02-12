<template>
  <div class="presets-container">
    <div v-if="allPresets.length === 0" class="empty-state">
      No presets defined. Use <code>definePresets()</code> or the "Create
      Preset" button in the Registry tab to add some.
    </div>
    <div v-else class="presets-split">
      <div class="presets-list" role="list">
        <button
          v-for="preset in allPresets"
          :key="preset.key"
          type="button"
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
        </button>
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
                  <button
                    type="button"
                    @click="handleApplyPreset(selectedPreset.name)"
                    class="apply-preset-button compact"
                  >
                    Apply Preset
                  </button>
                  <button
                    v-if="selectedPreset.isCustom"
                    type="button"
                    @click="handleDeletePreset(selectedPreset.name)"
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
                  </button>
                </div>
              </div>
              <p
                v-if="selectedPreset.description"
                class="preset-description"
              >
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
                  <span
                    v-if="scenarioRegistry && scenarioRegistry[hKey]"
                    class="method-badge mini"
                    :class="[scenarioRegistry[hKey].method?.toLowerCase()]"
                  >
                    {{ scenarioRegistry[hKey].method }}
                  </span>
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
import { computed, ref } from "vue";
import {
  presets,
  customPresets,
  scenarioRegistry,
  applyPreset,
} from "../../mswRegistry";

interface Preset {
  name: string;
  description?: string;
  scenarios: Record<string, string>;
  isCustom: boolean;
  key: string;
}

const PRESET_KEY_PREFIX_GLOBAL = "preset:global:";
const PRESET_KEY_PREFIX_CUSTOM = "preset:custom:";

const getPresetKey = (name: string, isCustom: boolean) => {
  return isCustom
    ? `${PRESET_KEY_PREFIX_CUSTOM}${name}`
    : `${PRESET_KEY_PREFIX_GLOBAL}${name}`;
};

const selectedPresetName = ref<string | null>(null);

const allPresets = computed<Preset[]>(() => {
  return [
    ...presets.map((p) => ({ ...p, isCustom: false, key: getPresetKey(p.name, false) })),
    ...customPresets.value.map((p) => ({ ...p, isCustom: true, key: getPresetKey(p.name, true) })),
  ];
});

const selectedPreset = computed(() => {
  return allPresets.value.find((p) => p.key === selectedPresetName.value) || null;
});

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

const handleApplyPreset = (name: string) => {
  applyPreset(name);
};

const handleDeletePreset = (name: string) => {
  const idx = customPresets.value.findIndex((p) => p.name === name);
  if (idx > -1) {
    customPresets.value.splice(idx, 1);
    if (selectedPresetName.value === getPresetKey(name, true)) {
      selectedPresetName.value = null;
    }
  }
};
</script>

<style scoped>
.presets-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.presets-split {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  flex: 1;
  overflow: hidden;
  padding: 1.5rem;
}

.presets-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.presets-list-item {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.presets-list-item:hover {
  border-color: var(--accent-color);
  background-color: var(--bg-tertiary);
}

.presets-list-item.active {
  background-color: var(--accent-soft);
  border-color: var(--accent-color);
}

.preset-list-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.preset-list-name {
  font-weight: 700;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-list-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.preset-count {
  font-weight: 600;
}

.preset-list-desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.presets-detail {
  overflow-y: auto;
  padding-right: 0.5rem;
}

.preset-detail-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.preset-detail-card.is-custom {
  border-color: var(--accent-color);
}

.preset-detail-header {
  margin-bottom: 1.5rem;
}

.preset-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.preset-title-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preset-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.preset-title-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.apply-preset-button {
  background-color: var(--accent-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.apply-preset-button:hover {
  background-color: var(--accent-hover);
}

.apply-preset-button.compact {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
}

.delete-preset-button {
  padding: 0.4rem;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-preset-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

.preset-description {
  color: var(--text-secondary);
  margin: 0;
}

.preset-scenarios-preview {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preview-tag {
  background-color: var(--bg-main);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.preview-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-scenario {
  font-weight: 600;
  color: var(--text-main);
}

.preview-text {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-state code {
  background-color: var(--bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--accent-color);
}

.custom-badge {
  background-color: var(--accent-soft);
  color: var(--accent-color);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
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
</style>
