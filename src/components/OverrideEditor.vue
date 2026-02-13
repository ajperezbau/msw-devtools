<template>
  <div class="override-editor-overlay" @click.self="$emit('close')">
    <div class="override-editor-content">
      <div class="editor-header">
        <h3>Override Response: {{ editingKey }}</h3>
        <MswButton
          type="button"
          variant="icon"
          @click="$emit('close')"
          class="close-button"
        >
          &times;
        </MswButton>
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
            <MswButton
              type="button"
              variant="ghost"
              size="sm"
              @click="formatEditorJson"
              class="format-button"
            >
              Format JSON
            </MswButton>
          </div>
          <textarea
            v-model="overrideForm.body"
            class="body-textarea"
            placeholder='{"key": "value"}'
          ></textarea>
        </div>
      </div>
      <div class="editor-footer">
        <MswButton type="button" @click="clearOverride">
          Clear Current Override
        </MswButton>
        <div class="spacer"></div>
        <MswButton type="button" @click="$emit('close')"> Cancel </MswButton>
        <MswButton type="button" variant="primary" @click="saveOverride">
          {{
            overrideForm.scenarioName
              ? "Save as Scenario"
              : "Save & Enable Override"
          }}
        </MswButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import MswButton from "./MswButton.vue";
import {
  customOverrides,
  customScenarios,
  scenarioRegistry,
  scenarioState,
} from "../mswRegistry";

interface InitialOverrideData {
  body: string;
  status: number;
}

const props = defineProps<{
  editingKey: string;
  initialData?: InitialOverrideData | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const overrideForm = ref({
  body: "",
  status: 200,
  enabled: true,
  scenarioName: "",
});

const initializeForm = () => {
  if (props.initialData) {
    overrideForm.value = {
      body: props.initialData.body,
      status: props.initialData.status,
      enabled: true,
      scenarioName: "",
    };
  } else {
    const existing = customOverrides[props.editingKey];
    overrideForm.value = {
      body: existing?.body ?? "",
      status: existing?.status ?? 200,
      enabled: true,
      scenarioName: "",
    };
  }
};

onMounted(initializeForm);

watch(() => props.editingKey, initializeForm);
watch(() => props.initialData, initializeForm);

const saveOverride = () => {
  const key = props.editingKey;
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

  emit("close");
};

const formatEditorJson = () => {
  const body = overrideForm.value.body.trim();
  if (!body) return;

  try {
    const parsed = JSON.parse(body);
    overrideForm.value.body = JSON.stringify(parsed, null, 2);
  } catch {
    // Not valid JSON
  }
};

const clearOverride = () => {
  delete customOverrides[props.editingKey];
  emit("close");
};
</script>

<style scoped>
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
  background-color: var(--bg-main);
  border-radius: 0.75rem;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--modal-shadow);
  max-height: 80vh;
  border: 1px solid var(--border-color);
}

.editor-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
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
  color: var(--text-secondary);
}

.input-subtitle {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  margin-top: -0.25rem;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.label-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.format-button {
  font-size: 0.6875rem;
  background-color: var(--bg-tertiary);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-weight: 600;
}

.format-button:hover {
  background-color: var(--bg-secondary);
  border-color: var(--text-tertiary);
}

.status-input,
.scenario-name-input {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background-color: var(--input-bg);
  color: var(--text-main);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.status-input:focus,
.scenario-name-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.scenario-name-input {
  width: 100%;
}

.status-input {
  width: 100px;
}

.body-textarea {
  height: 250px;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  resize: vertical;
  background-color: var(--input-bg);
  color: var(--text-main);
  transition: all 0.2s;
}

.body-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.editor-footer {
  padding: 1.25rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 0.75rem;
}

.spacer {
  flex: 1;
}
</style>
