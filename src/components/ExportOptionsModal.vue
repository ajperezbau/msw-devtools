<script setup lang="ts">
import { computed } from "vue";
import MswButton from "./MswButton.vue";
import MswCheckbox from "./MswCheckbox.vue";
import type { ExportOptions } from "../types";

const exportOptionKeys = [
  "scenarios",
  "delays",
  "overrides",
  "customScenarios",
  "customPresets",
  "globalDelay",
] as const;
type ExportOptionKey = (typeof exportOptionKeys)[number];

const props = defineProps<{
  options: ExportOptions;
}>();

const emit = defineEmits<{
  (e: "update:options", value: ExportOptions): void;
  (e: "close"): void;
  (e: "export"): void;
}>();

const allOptionsSelected = computed({
  get: () => Object.values(props.options).every((value) => value),
  set: (value: boolean) => {
    const nextOptions = { ...props.options } as ExportOptions;
    exportOptionKeys.forEach((key) => {
      nextOptions[key] = value;
    });
    emit("update:options", nextOptions);
  },
});

const isExportDisabled = computed(() =>
  Object.values(props.options).every((value) => !value),
);

const updateOption = (key: ExportOptionKey, value: boolean) => {
  emit("update:options", {
    ...props.options,
    [key]: value,
  });
};
</script>

<template>
  <div class="export-modal-overlay" @click.self="emit('close')">
    <div class="export-modal-content">
      <div class="export-header">
        <div class="export-title">
          <h3>Export Options</h3>
          <p>Select what you want to include in the export:</p>
        </div>
        <MswButton
          type="button"
          variant="icon"
          size="sm"
          class="close-button"
          @click="emit('close')"
          aria-label="Close export dialog"
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
        </MswButton>
      </div>

      <div class="export-body">
        <div class="export-options-list">
          <MswCheckbox
            :model-value="allOptionsSelected"
            @update:modelValue="allOptionsSelected = $event"
            :label-style="{
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-color)',
            }"
          >
            <span class="select-all-label">Select All</span>
          </MswCheckbox>
          <MswCheckbox
            :model-value="props.options.scenarios"
            @update:modelValue="updateOption('scenarios', $event)"
            :label-style="{ marginBottom: '0.75rem' }"
          >
            Active Scenarios Selection
          </MswCheckbox>
          <MswCheckbox
            :model-value="props.options.customScenarios"
            @update:modelValue="updateOption('customScenarios', $event)"
            :label-style="{ marginBottom: '0.75rem' }"
          >
            Custom Handlers (JSON scenarios)
          </MswCheckbox>
          <MswCheckbox
            :model-value="props.options.customPresets"
            @update:modelValue="updateOption('customPresets', $event)"
            :label-style="{ marginBottom: '0.75rem' }"
          >
            Custom Presets (Recipes)
          </MswCheckbox>
          <MswCheckbox
            :model-value="props.options.overrides"
            @update:modelValue="updateOption('overrides', $event)"
            :label-style="{ marginBottom: '0.75rem' }"
          >
            Manual Overrides
          </MswCheckbox>
          <MswCheckbox
            :model-value="props.options.delays"
            @update:modelValue="updateOption('delays', $event)"
            :label-style="{ marginBottom: '0.75rem' }"
          >
            Handler Delays
          </MswCheckbox>
          <MswCheckbox
            :model-value="props.options.globalDelay"
            @update:modelValue="updateOption('globalDelay', $event)"
            :label-style="{ marginBottom: '0.75rem' }"
          >
            Global Delay Settings
          </MswCheckbox>
        </div>
      </div>

      <div class="export-footer">
        <MswButton type="button" size="sm" @click="emit('close')">
          Cancel
        </MswButton>
        <div class="spacer"></div>
        <MswButton
          type="button"
          variant="primary"
          size="sm"
          @click="emit('export')"
          :disabled="isExportDisabled"
        >
          Download JSON
        </MswButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-modal-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 2rem;
}

.export-modal-content {
  background-color: var(--bg-main);
  border-radius: 0.75rem;
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--modal-shadow);
  max-height: 80vh;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.export-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.export-title h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-main);
}

.export-title p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.export-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
}

.export-options-list {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.select-all-label {
  font-weight: 700;
}

.export-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.spacer {
  flex: 1;
}
</style>
