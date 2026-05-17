<template>
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
              <span class="request-url" :title="entry.url">{{
                entry.url
              }}</span>
            </div>
          </button>
        </div>
      </section>

      <section class="panel-card preview-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Response Preview</h3>
            <p class="card-description">{{ preview.description }}</p>
          </div>
          <div class="preview-card-actions">
            <MswBadge
              v-if="preview.status !== null"
              variant="status"
              :label="String(preview.status)"
            />
            <MswButton
              v-if="canExpandPreview"
              type="button"
              variant="icon"
              size="sm"
              class="preview-expand-button"
              title="Expand response preview"
              aria-label="Expand response preview"
              @click="openExpandedPreview"
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
                  d="M8 3H5a2 2 0 00-2 2v3m16 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3m-16 0v3a2 2 0 002 2h3"
                />
              </svg>
            </MswButton>
          </div>
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
          <strong>{{ previewExampleTitle }}</strong>
          <span v-if="preview.source === 'example'">
            The latest request did not store a response body, but it returned
            status {{ preview.exampleStatusOnly }}.
          </span>
          <span v-else>
            The selected configuration returns status
            {{ preview.exampleStatusOnly }} without a previewable body.
          </span>
        </div>
        <div v-else class="empty-card">
          No preview data available for the selected configuration.
        </div>
      </section>

      <section class="panel-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Handler Info</h3>
            <p class="card-description">Useful metadata and request stats.</p>
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

    <Transition name="expanded-preview">
      <div
        v-if="isPreviewExpanded"
        class="expanded-preview-overlay"
        @click.self="closeExpandedPreview"
      >
        <section
          class="expanded-preview-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expanded-response-preview-title"
        >
          <div class="expanded-preview-header">
            <div>
              <h3 id="expanded-response-preview-title" class="card-title">
                Expanded Response Preview
              </h3>
              <p class="card-description">{{ preview.description }}</p>
            </div>
            <div class="preview-card-actions">
              <MswBadge
                v-if="preview.status !== null"
                variant="status"
                :label="String(preview.status)"
              />
              <MswButton
                type="button"
                variant="icon"
                size="sm"
                class="preview-expand-button"
                title="Close expanded response preview"
                aria-label="Close expanded response preview"
                @click="closeExpandedPreview"
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
          </div>

          <div class="expanded-preview-body">
            <div v-if="preview.notice" class="preview-notice">
              {{ preview.notice }}
            </div>

            <CodeBlock
              v-if="preview.body !== null"
              :code="preview.body"
              :language="preview.language"
              max-height="calc(80vh - 11rem)"
            />
            <div
              v-else-if="preview.exampleStatusOnly"
              class="empty-card preview-example-card"
            >
              <strong>{{ previewExampleTitle }}</strong>
              <span v-if="preview.source === 'example'">
                The latest request did not store a response body, but it
                returned status {{ preview.exampleStatusOnly }}.
              </span>
              <span v-else>
                The selected configuration returns status
                {{ preview.exampleStatusOnly }} without a previewable body.
              </span>
            </div>
            <div v-else class="empty-card">
              No preview data available for the selected configuration.
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import CodeBlock from "./CodeBlock.vue";
import MswBadge from "./MswBadge.vue";
import MswButton from "./MswButton.vue";
import {
  activityLog,
  customOverrides,
  customScenarios,
  displayKey,
  getHandlerPreview,
  scenarioRegistry,
  scenarioState,
} from "../mswRegistry";
import type { HandlerPreviewResult } from "../types";

const props = defineProps<{
  handlerKey: string;
  selectedLogId?: string | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "view-log-entry", entryId: string): void;
}>();

const metadata = computed(() => scenarioRegistry[props.handlerKey]!);

const currentScenario = computed({
  get: () =>
    scenarioState[props.handlerKey] ??
    metadata.value?.defaultScenario ??
    "default",
  set: (value: string) => {
    scenarioState[props.handlerKey] = value;
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

const preview = ref<HandlerPreviewResult>({
  source: "unavailable",
  description: "No preview data available for the selected configuration.",
  notice: null,
  status: null,
  body: null,
  language: "json",
  exampleStatusOnly: null,
});
const isPreviewExpanded = ref(false);

const canExpandPreview = computed(
  () =>
    preview.value.body !== null ||
    preview.value.notice !== null ||
    preview.value.exampleStatusOnly !== null,
);

const previewExampleTitle = computed(() =>
  preview.value.source === "example"
    ? "Latest example available."
    : "Status preview available.",
);

let previewRequestId = 0;

const openExpandedPreview = () => {
  if (!canExpandPreview.value) return;
  isPreviewExpanded.value = true;
};

const closeExpandedPreview = () => {
  isPreviewExpanded.value = false;
};

const syncPreview = async () => {
  const requestId = ++previewRequestId;
  const nextPreview = await getHandlerPreview(props.handlerKey);

  if (requestId === previewRequestId) {
    preview.value = nextPreview;
  }
};

watch(
  [
    () => props.handlerKey,
    currentScenario,
    () => activeOverride.value?.enabled,
    () => activeOverride.value?.body,
    () => activeOverride.value?.status,
    () => activeCustomScenario.value?.body,
    () => activeCustomScenario.value?.status,
    () => handlerRequests.value.map((entry) => entry.id).join(","),
  ],
  () => {
    void syncPreview();
  },
  { immediate: true },
);

watch(
  () => props.handlerKey,
  () => {
    closeExpandedPreview();
  },
);

watch(canExpandPreview, (value) => {
  if (!value && isPreviewExpanded.value) {
    closeExpandedPreview();
  }
});

const handleExpandedPreviewKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Escape" || !isPreviewExpanded.value) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  closeExpandedPreview();
};

onMounted(() => {
  window.addEventListener("keydown", handleExpandedPreviewKeydown, true);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleExpandedPreviewKeydown, true);
});

const formatScenarioLabel = (scenario: string) => {
  if (scenario === "passthrough") return "Real API";
  if (scenario === "🌐 Real API (Recorded)") return "Real API (Recorded)";
  if (scenario === "🌐 Real API (Not Recorded)")
    return "Real API (Not Recorded)";
  if (scenario === "❌ Real API (Error Recorded)") return "Real API (Error)";
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
.inspector-panel {
  width: 100%;
  min-width: 0;
  max-width: none;
  height: 100%;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  box-shadow: -12px 0 28px rgba(15, 23, 42, 0.14);
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

.preview-card-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.preview-expand-button.msw-button {
  flex-shrink: 0;
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

.expanded-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: rgba(0, 0, 0, 0.36);
  backdrop-filter: blur(4px);
}

.expanded-preview-card {
  width: min(960px, calc(100vw - 3rem));
  max-height: min(86vh, 960px);
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.expanded-preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.875rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.expanded-preview-body {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem;
  overflow-y: auto;
}

.expanded-preview-enter-active,
.expanded-preview-leave-active {
  transition: opacity 220ms ease;
}

.expanded-preview-enter-active .expanded-preview-card,
.expanded-preview-leave-active .expanded-preview-card {
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 220ms ease;
}

.expanded-preview-enter-from,
.expanded-preview-leave-to {
  opacity: 0;
}

.expanded-preview-enter-from .expanded-preview-card,
.expanded-preview-leave-to .expanded-preview-card {
  transform: translateY(20px) scale(0.96);
  opacity: 0;
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

@media (max-width: 640px) {
  .expanded-preview-overlay {
    padding: 0.75rem;
  }

  .expanded-preview-card {
    width: 100%;
    max-height: calc(100vh - 1.5rem);
  }
}
</style>
