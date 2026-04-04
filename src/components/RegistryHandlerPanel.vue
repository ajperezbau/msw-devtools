<template>
  <div class="inspector-overlay" @click.self="emit('close')">
    <aside
      class="inspector-panel"
      role="complementary"
      aria-labelledby="registry-handler-panel-title"
    >
      <div class="panel-header">
        <div class="panel-heading">
          <div class="panel-badges">
            <MswBadge variant="method" :label="metadata.method" />
            <MswBadge
              v-if="metadata.isNative"
              variant="native"
              label="Native"
              size="sm"
            />
            <span v-if="hasActiveOverride" class="state-pill override-pill">
              Override active
            </span>
            <span
              v-else-if="isCurrentScenarioCustom"
              class="state-pill custom-pill"
            >
              Custom scenario
            </span>
          </div>
          <h2 id="registry-handler-panel-title" class="panel-title">
            {{ displayKey(handlerKey) }}
          </h2>
          <p class="panel-url" :title="metadata.url">{{ metadata.url }}</p>
        </div>

        <MswButton
          type="button"
          variant="icon"
          size="sm"
          class="close-button"
          title="Close handler details"
          aria-label="Close handler details"
          @click="emit('close')"
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

      <div class="panel-body">
        <section class="panel-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Recent Requests</h3>
              <p class="card-description">
                Latest requests handled by this handler.
              </p>
            </div>
            <span class="card-meta">
              {{ recentRequests.length }}/{{ totalRequestCount }}
            </span>
          </div>

          <div v-if="recentRequests.length === 0" class="empty-card">
            No requests recorded for this handler yet.
          </div>

          <div v-else class="request-list">
            <button
              v-for="entry in recentRequests"
              :key="entry.id"
              type="button"
              class="request-link"
              :class="{ selected: selectedLogId === entry.id }"
              @click="emit('view-log-entry', entry.id)"
            >
              <div class="request-link-top">
                <div class="request-status">
                  <MswBadge
                    variant="status"
                    size="sm"
                    :label="String(entry.status)"
                  />
                  <span class="request-scenario">
                    {{ formatScenarioLabel(entry.scenario) }}
                  </span>
                </div>
                <span class="request-time">
                  {{ formatFullTime(entry.timestamp) }}
                </span>
              </div>
              <div class="request-link-bottom">
                <span class="request-method">{{ entry.method }}</span>
                <span class="request-url" :title="entry.url">{{ entry.url }}</span>
              </div>
            </button>
          </div>
        </section>

        <section class="panel-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Response Preview</h3>
              <p class="card-description">{{ preview.description }}</p>
            </div>
            <MswBadge
              v-if="preview.status !== null"
              variant="status"
              :label="String(preview.status)"
            />
          </div>

          <div v-if="preview.notice" class="preview-notice">
            {{ preview.notice }}
          </div>

          <CodeBlock
            v-if="preview.body !== null"
            :code="preview.body"
            :language="preview.language"
            max-height="260px"
          />
          <div
            v-else-if="preview.exampleStatusOnly"
            class="empty-card preview-example-card"
          >
            <strong>Latest example available.</strong>
            <span>
              The latest request did not store a response body, but it returned
              status {{ preview.exampleStatusOnly }}.
            </span>
          </div>
          <div v-else class="empty-card">
            No preview data available for the selected configuration.
          </div>
        </section>

        <section class="panel-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Current Configuration</h3>
              <p class="card-description">
                Scenario and delay applied to this handler.
              </p>
            </div>
            <MswButton
              type="button"
              variant="ghost"
              size="sm"
              class="override-link"
              @click="emit('open-override', handlerKey)"
            >
              Edit override
            </MswButton>
          </div>

          <div class="config-grid">
            <div class="config-field">
              <label :for="scenarioSelectId">Scenario</label>
              <select
                :id="scenarioSelectId"
                v-model="currentScenario"
                class="scenario-select"
              >
                <option
                  v-for="scenario in metadata.scenarios"
                  :key="scenario"
                  :value="scenario"
                >
                  {{ formatScenarioOption(scenario) }}
                </option>
              </select>
            </div>

            <div class="config-field">
              <label :for="delayInputId">Delay (ms)</label>
              <div class="delay-input-wrapper">
                <input
                  :id="delayInputId"
                  v-model.number="currentDelay"
                  type="number"
                  min="0"
                  max="10000"
                  step="50"
                  class="delay-input"
                  :disabled="currentScenario === 'passthrough'"
                />
                <span class="ms-label">ms</span>
              </div>
            </div>
          </div>
        </section>

        <section class="panel-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Handler Info</h3>
              <p class="card-description">
                Useful metadata and request stats.
              </p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Method</span>
              <span class="info-value">{{ metadata.method }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Default scenario</span>
              <span class="info-value">{{
                formatScenarioLabel(metadata.defaultScenario)
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Initial scenario</span>
              <span class="info-value">{{
                formatScenarioLabel(metadata.initialScenario)
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Available scenarios</span>
              <span class="info-value">{{ metadata.scenarios.length }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Custom scenarios</span>
              <span class="info-value">{{ customScenarioCount }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Recorded requests</span>
              <span class="info-value">{{ totalRequestCount }}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">Last request</span>
              <span class="info-value">
                {{
                  latestRequest
                    ? formatFullTime(latestRequest.timestamp)
                    : "No requests yet"
                }}
              </span>
            </div>
          </div>
        </section>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CodeBlock from "./CodeBlock.vue";
import MswBadge from "./MswBadge.vue";
import MswButton from "./MswButton.vue";
import {
  activityLog,
  customOverrides,
  customScenarios,
  displayKey,
  handlerDelays,
  scenarioRegistry,
  scenarioState,
} from "../mswRegistry";

const props = defineProps<{
  handlerKey: string;
  selectedLogId?: string | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "view-log-entry", entryId: string): void;
  (e: "open-override", key: string): void;
}>();

const metadata = computed(() => scenarioRegistry[props.handlerKey]!);

const scenarioSelectId = computed(
  () => `handler-scenario-${props.handlerKey.replace(/\s+/g, "-")}`,
);
const delayInputId = computed(
  () => `handler-delay-${props.handlerKey.replace(/\s+/g, "-")}`,
);

const currentScenario = computed({
  get: () =>
    scenarioState[props.handlerKey] ?? metadata.value?.defaultScenario ?? "default",
  set: (value: string) => {
    scenarioState[props.handlerKey] = value;
  },
});

const currentDelay = computed({
  get: () => handlerDelays[props.handlerKey] ?? 0,
  set: (value: number) => {
    handlerDelays[props.handlerKey] = Number.isFinite(value) ? value : 0;
  },
});

const handlerRequests = computed(() =>
  activityLog.filter((entry) => entry.key === props.handlerKey),
);

const recentRequests = computed(() => handlerRequests.value.slice(0, 5));
const totalRequestCount = computed(() => handlerRequests.value.length);
const latestRequest = computed(() => handlerRequests.value[0] ?? null);
const customScenarioCount = computed(
  () => Object.keys(customScenarios[props.handlerKey] || {}).length,
);

const activeOverride = computed(() => customOverrides[props.handlerKey]);
const hasActiveOverride = computed(
  () =>
    !!activeOverride.value?.enabled && currentScenario.value !== "passthrough",
);

const activeCustomScenario = computed(
  () => customScenarios[props.handlerKey]?.[currentScenario.value] ?? null,
);
const isCurrentScenarioCustom = computed(() => !!activeCustomScenario.value);

const parsePreviewCode = (value: unknown) => {
  if (value === null || value === undefined) {
    return { body: null as string | object | null, language: "json" as const };
  }

  if (typeof value !== "string") {
    return { body: value, language: "json" as const };
  }

  try {
    return { body: JSON.parse(value), language: "json" as const };
  } catch {
    return { body: value, language: "text" as const };
  }
};

const findExampleRequest = () => {
  if (handlerRequests.value.length === 0) return null;

  if (currentScenario.value === "passthrough") {
    return (
      handlerRequests.value.find((entry) => entry.scenario.includes("Real API")) ??
      handlerRequests.value[0] ??
      null
    );
  }

  return (
    handlerRequests.value.find((entry) => entry.scenario === currentScenario.value) ??
    handlerRequests.value[0] ??
    null
  );
};

const preview = computed(() => {
  if (hasActiveOverride.value && activeOverride.value) {
    const parsed = parsePreviewCode(activeOverride.value.body);
    return {
      description: "Effective response from the active manual override.",
      notice: null as string | null,
      status: activeOverride.value.status,
      body: parsed.body,
      language: parsed.language,
      exampleStatusOnly: null as number | null,
    };
  }

  if (activeCustomScenario.value) {
    const parsed = parsePreviewCode(activeCustomScenario.value.body);
    return {
      description: "Preview generated from the selected custom scenario.",
      notice: null as string | null,
      status: activeCustomScenario.value.status,
      body: parsed.body,
      language: parsed.language,
      exampleStatusOnly: null as number | null,
    };
  }

  const exampleRequest = findExampleRequest();
  const exampleResponse = exampleRequest?.responseBody;
  const exampleStatus =
    exampleRequest && exampleRequest.status > 0 ? exampleRequest.status : null;
  const parsedExample =
    exampleResponse === "__PASSTHROUGH_NO_RECORD__"
      ? { body: null as string | object | null, language: "json" as const }
      : parsePreviewCode(exampleResponse);

  return {
    description:
      currentScenario.value === "passthrough"
        ? "Preview is unavailable because the request uses the real network."
        : "Preview is unavailable because this scenario is defined in code and may be dynamic.",
    notice:
      currentScenario.value === "passthrough"
        ? "This handler is currently using the real API, so the response cannot be known ahead of time."
        : "The selected scenario is defined in code, so the response cannot be previewed safely without executing the handler.",
    status: exampleStatus,
    body: parsedExample.body,
    language: parsedExample.language,
    exampleStatusOnly:
      parsedExample.body === null && exampleStatus ? exampleStatus : null,
  };
});

const formatScenarioLabel = (scenario: string) => {
  if (scenario === "passthrough") return "Real API";
  if (scenario === "🌐 Real API (Recorded)") return "Real API (Recorded)";
  if (scenario === "🌐 Real API (Not Recorded)") return "Real API (Not Recorded)";
  if (scenario === "❌ Real API (Error Recorded)") return "Real API (Error)";
  return scenario;
};

const formatScenarioOption = (scenario: string) => {
  if (scenario === "passthrough") return "Real API 🌐";
  if (customScenarios[props.handlerKey]?.[scenario]) return `${scenario} ✨`;
  return scenario;
};

const formatFullTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${time}.${String(date.getMilliseconds()).padStart(3, "0")}`;
};
</script>

<style scoped>
.inspector-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(2px);
  z-index: 20;
}

.inspector-panel {
  width: min(440px, 100%);
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  box-shadow: -16px 0 32px rgba(15, 23, 42, 0.18);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.panel-heading {
  min-width: 0;
  flex: 1;
}

.panel-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.state-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
}

.override-pill {
  background: rgba(251, 191, 36, 0.18);
  color: #b45309;
}

.custom-pill {
  background: rgba(99, 102, 241, 0.14);
  color: #4f46e5;
}

.panel-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-url {
  margin: 0.35rem 0 0;
  color: var(--text-tertiary);
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem;
  overflow-y: auto;
}

.panel-card {
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 0.875rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.card-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-main);
}

.card-description {
  margin: 0.35rem 0 0;
  color: var(--text-tertiary);
  font-size: 0.75rem;
  line-height: 1.4;
}

.card-meta {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.empty-card {
  border: 1px dashed var(--border-color);
  border-radius: 0.75rem;
  padding: 0.9rem;
  color: var(--text-tertiary);
  font-size: 0.8125rem;
  line-height: 1.5;
  background: var(--bg-secondary);
}

.preview-example-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.request-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.request-link {
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  color: inherit;
}

.request-link:hover {
  border-color: var(--accent-color);
  background: var(--bg-tertiary);
}

.request-link.selected {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.request-link-top,
.request-link-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.request-link-bottom {
  margin-top: 0.45rem;
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

.request-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.request-scenario,
.request-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-time,
.request-method {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.request-method {
  color: var(--text-secondary);
  font-weight: 700;
}

.preview-notice {
  border-left: 3px solid var(--accent-color);
  background: var(--accent-soft);
  color: var(--text-secondary);
  border-radius: 0.75rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.8125rem;
  line-height: 1.5;
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.875rem;
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.config-field label {
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
}

.scenario-select,
.delay-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  padding: 0.55rem 0.65rem;
  font-size: 0.875rem;
  color: var(--text-main);
  background: var(--input-bg);
}

.scenario-select:focus,
.delay-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.delay-input:disabled {
  opacity: 0.5;
}

.delay-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ms-label {
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

.override-link.msw-button {
  padding-inline: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  color: var(--text-tertiary);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  color: var(--text-main);
  font-size: 0.875rem;
  font-weight: 600;
  word-break: break-word;
}

.h-5 {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
