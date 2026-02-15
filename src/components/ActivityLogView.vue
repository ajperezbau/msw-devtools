<template>
  <div class="activity-view">
    <!-- Left Sidebar: Request List -->
    <div class="activity-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-toolbar">
          <div class="method-filters">
            <button
              v-for="method in ['ALL', 'GET', 'POST', 'PUT', 'DELETE']"
              :key="method"
              type="button"
              class="filter-chip"
              :class="{
                active: selectedMethods.has(method),
                [method.toLowerCase()]: true,
              }"
              @click="toggleMethod(method)"
            >
              {{ method }}
            </button>
          </div>
          <MswButton
            type="button"
            variant="icon"
            size="sm"
            @click="clearActivityLog"
            title="Clear logs"
            class="clear-btn"
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
        <div class="requests-count">
          Requests ({{ filteredActivityLog.length }})
        </div>
      </div>
      
      <div class="sidebar-search">
        <div class="search-wrapper">
          <MswInput
            v-model="searchQuery"
            placeholder="Filter requests..."
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
      </div>

      <div v-if="filterKey" class="filter-banner">
        <span>Filter: <strong>{{ filterKey }}</strong></span>
        <button class="reset-link" @click="emit('update:filterKey', null)">
          Reset
        </button>
      </div>

      <div class="sidebar-list" role="list">
        <div v-if="filteredActivityLog.length === 0" class="empty-list">
          No requests found
        </div>
        <div
          v-for="entry in filteredActivityLog"
          :key="entry.id"
          class="list-item"
          :class="{
            selected: selectedLogId === entry.id,
            'is-error': entry.status >= 400,
          }"
          @click="selectLog(entry.id)"
          role="listitem"
        >
          <div class="list-item-row top">
            <MswBadge variant="method" :label="entry.method" />
            <span class="list-url" :title="entry.key">{{ displayKey(entry.key) }}</span>
            <span class="list-time">{{ formatTime(entry.timestamp) }}</span>
          </div>
          <div class="list-item-row bottom">
            <div class="status-indicator">
              <span
                class="status-dot"
                :class="{
                  success: entry.status >= 200 && entry.status < 300,
                  warning: entry.status >= 300 && entry.status < 400,
                  error: entry.status >= 400,
                }"
              ></span>
              <span class="status-code">{{ entry.status }}</span>
            </div>
            <span class="source-label">
              {{ entry.scenario }}
              <span v-if="scenarioRegistry[entry.key]?.isNative" class="native-tag">
                (Native)
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel: Details -->
    <div class="activity-details">
      <div v-if="!selectedLog" class="details-placeholder">
        <div class="placeholder-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="placeholder-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>Select a request to view details</p>
        </div>
      </div>

      <template v-else>
        <div class="details-header">
          <div class="header-top">
            <h2 class="header-title">{{ displayKey(selectedLog.key) }}</h2>
            <span
              class="status-pill"
              :class="{
                success: selectedLog.status >= 200 && selectedLog.status < 300,
                warning: selectedLog.status >= 300 && selectedLog.status < 400,
                error: selectedLog.status >= 400,
              }"
            >
              {{ selectedLog.status }} {{ statusMap[selectedLog.status] }}
            </span>
          </div>
          <div class="header-meta">
            <span class="method-text">{{ selectedLog.method }}</span>
            <span class="separator">•</span>
            <span class="url-text">{{ selectedLog.url }}</span>
          </div>
          
          <div class="details-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
              <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
            </button>
          </div>
        </div>

        <div class="details-content">
          <!-- General Tab -->
          <div v-if="activeTab === 'general'" class="tab-pane general-pane">
            <div class="info-grid">
              <div class="info-card">
                <label>Timestamp</label>
                <div class="info-value big">{{ formatFullTime(selectedLog.timestamp) }}</div>
              </div>
               <div class="info-card">
                <label>Source</label>
                <div class="info-value">
                  <span class="source-badge">
                    {{ selectedLog.scenario }}
                    {{ isCustomScenario(selectedLog.key, selectedLog.scenario) ? '✨' : '' }}
                  </span>
                </div>
              </div>
              <div class="info-card full-width">
                <label>Handler Key</label>
                <div class="info-value code">{{ displayKey(selectedLog.key) }}</div>
                 <button class="link-btn" @click="emit('view-handler', selectedLog.key)">
                    View in Registry →
                 </button>
              </div>
            </div>
          </div>

          <!-- Request Tab -->
          <div v-if="activeTab === 'request'" class="tab-pane request-pane">
            <div v-if="selectedLog.headers && Object.keys(selectedLog.headers).length > 0" class="details-section">
              <h3 class="section-title">Request Headers</h3>
              <div class="key-value-table">
                <div class="table-header">
                  <div class="col-key">Key</div>
                  <div class="col-value">Value</div>
                </div>
                <div v-for="(value, key) in selectedLog.headers" :key="key" class="table-row">
                  <div class="col-key" :title="key">{{ key }}</div>
                  <div class="col-value" :title="value">{{ value }}</div>
                </div>
              </div>
            </div>

            <div class="params-grid">
              <div v-if="selectedLog.pathParams && Object.keys(selectedLog.pathParams).length > 0" class="details-section">
                <h3 class="section-title">Path Parameters</h3>
                <div class="key-value-table">
                  <div class="table-header">
                    <div class="col-key">Key</div>
                    <div class="col-value">Value</div>
                  </div>
                  <div v-for="(value, key) in selectedLog.pathParams" :key="key" class="table-row">
                    <div class="col-key mono" :title="`:${key}`">:{{ key }}</div>
                    <div class="col-value" :title="value">{{ value }}</div>
                  </div>
                </div>
              </div>

              <div v-if="selectedLog.queryParams && Object.keys(selectedLog.queryParams).length > 0" class="details-section">
                <h3 class="section-title">Query Parameters</h3>
                <div class="key-value-table">
                  <div class="table-header">
                    <div class="col-key">Key</div>
                    <div class="col-value">Value</div>
                  </div>
                  <div v-for="(value, key) in selectedLog.queryParams" :key="key" class="table-row">
                    <div class="col-key mono" :title="key">{{ key }}</div>
                    <div class="col-value" :title="value">{{ value }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="details-section">
              <h3 class="section-title">Request Body</h3>
              <CodeBlock 
                v-if="selectedLog.requestBody" 
                :code="selectedLog.requestBody" 
                language="json"
              />
              <div v-else class="empty-pane no-border">No request body</div>
            </div>
          </div>

          <!-- Response Tab -->
          <div v-if="activeTab === 'response'" class="tab-pane">
            <CodeBlock 
              v-if="selectedLog.responseBody" 
              :code="selectedLog.responseBody" 
              language="json"
            >
              <template #header>
                 <button class="action-btn override-btn" @click="emit('open-override', selectedLog)">Use as Override</button>
              </template>
            </CodeBlock>
            <div v-else class="empty-pane">No response body</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import MswBadge from "./MswBadge.vue";
import MswButton from "./MswButton.vue";
import MswInput from "./MswInput.vue";
import CodeBlock from "./CodeBlock.vue";
import {
  activityLog,
  clearActivityLog,
  scenarioRegistry,
  customScenarios,
  displayKey,
} from "../mswRegistry";
import type { LogEntry } from "../types";

const props = defineProps<{
  filterKey: string | null;
}>();

const emit = defineEmits<{
  (e: "update:filterKey", value: string | null): void;
  (e: "open-override", entry: LogEntry): void;
  (e: "view-handler", key: string): void;
}>();

const selectedLogId = ref<string | null>(null);
const activeTab = ref("general");
const selectedMethods = ref<Set<string>>(new Set(["ALL"]));

// Status code map for display
const statusMap: Record<number, string> = {
  200: "OK", 201: "Created", 204: "No Content",
  301: "Moved Permanently", 304: "Not Modified",
  400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
  500: "Internal Server Error",
};

const selectedLog = computed(() => 
  activityLog.find(l => l.id === selectedLogId.value)
);

const tabs = computed(() => {
  const queryCount = selectedLog.value?.queryParams 
    ? Object.keys(selectedLog.value.queryParams).length 
    : 0;
  const pathCount = selectedLog.value?.pathParams 
    ? Object.keys(selectedLog.value.pathParams).length 
    : 0;
  const totalParamsCount = queryCount + pathCount;
    
  return [
    { id: 'general', label: 'General' },
    { 
      id: 'request', 
      label: 'Request', 
      count: totalParamsCount > 0 ? totalParamsCount : undefined 
    },
    { id: 'response', label: 'Response' } 
  ];
});

const isCustomScenario = (key: string, scenarioName: string) => {
  return customScenarios[key] && customScenarios[key][scenarioName];
};

const selectLog = (id: string) => {
  selectedLogId.value = id;
};

const toggleMethod = (method: string) => {
  if (method === "ALL") {
    selectedMethods.value.clear();
    selectedMethods.value.add("ALL");
  } else {
    selectedMethods.value.delete("ALL");
    if (selectedMethods.value.has(method)) {
      selectedMethods.value.delete(method);
      if (selectedMethods.value.size === 0) selectedMethods.value.add("ALL");
    } else {
      selectedMethods.value.add(method);
    }
  }
};

const searchQuery = ref("");

const filteredActivityLog = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return activityLog.filter((entry) => {
    const matchesKey = !props.filterKey || entry.key === props.filterKey;
    const matchesMethod =
      selectedMethods.value.has("ALL") ||
      selectedMethods.value.has(entry.method);
    
    // Search by URL, Key (displayed), or Method
    const matchesQuery = !query || 
        entry.url.toLowerCase().includes(query) || 
        displayKey(entry.key).toLowerCase().includes(query) ||
        entry.method.toLowerCase().includes(query);

    return matchesKey && matchesMethod && matchesQuery;
  });
});

watch(filteredActivityLog, (newLogs) => {
    if (selectedLogId.value && !newLogs.find(l => l.id === selectedLogId.value)) {
        selectedLogId.value = null;
    }
});



const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatFullTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const time = d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${time}.${ms}`;
};
</script>

<style scoped>
.activity-view {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-main);
  color: var(--text-main);
  font-family: inherit;
}

/* Sidebar */
.activity-sidebar {
  width: 350px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

.sidebar-header {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.sidebar-search {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.search-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.search-input.msw-input {
  width: 100%;
  padding-right: 2.5rem;
  font-size: 0.875rem;
}

.clear-search-button.msw-button {
  position: absolute;
  right: 0.5rem;
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

.sidebar-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.method-filters {
  display: flex;
  gap: 0.25rem;
}

.filter-chip {
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.filter-chip.active {
    background: var(--bg-tertiary); 
    color: var(--text-main);
    border-color: var(--border-color);
}
.filter-chip.active.get { color: var(--method-get-text); border-color: var(--method-get-border); background: var(--method-get-bg); }
.filter-chip.active.post { color: var(--method-post-text); border-color: var(--method-post-border); background: var(--method-post-bg); }
.filter-chip.active.put { color: var(--method-put-text); border-color: var(--method-put-border); background: var(--method-put-bg); }
.filter-chip.active.delete { color: var(--method-delete-text); border-color: var(--method-delete-border); background: var(--method-delete-bg); }
.filter-chip.active.all { color: var(--text-main); border-color: var(--border-color); background: var(--bg-tertiary); }


.requests-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-banner {
  padding: 0.5rem 0.75rem;
  background-color: var(--accent-soft);
  font-size: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.reset-link {
  background: none;
  border: none;
  color: var(--accent-color);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
}

.empty-list {
  padding: 2rem;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.8rem;
  font-style: italic;
}

.list-item {
  padding: 0.75rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.15s;
}

.list-item:hover {
  background-color: var(--bg-tertiary);
}

.list-item.selected {
  background-color: var(--bg-tertiary);
  border-left: 3px solid var(--accent-color);
  padding-left: calc(0.75rem - 3px); /* adjust padding to prevent jump */
}

.list-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.list-item-row.top {
  margin-bottom: 0.4rem;
}

.list-url {
  flex: 1;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-main);
  font-weight: 500;
}

.list-time {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--text-tertiary);
}
.status-dot.success { background-color: #10b981; }
.status-dot.warning { background-color: #f59e0b; }
.status-dot.error { background-color: #ef4444; }

.status-code {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.source-label {
    font-size: 0.7rem;
    color: var(--text-tertiary);
    text-align: right;
    width: 100%;
    margin-left: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.native-tag {
    opacity: 0.7;
    font-size: 0.65rem;
}

.h-3 { height: 0.75rem; }
.w-3 { width: 0.75rem; }
.h-4 { height: 1rem; }
.w-4 { width: 1rem; }

/* Details Panel */
.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-main);
  overflow: hidden;
}

.details-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
}
.placeholder-content {
  text-align: center;
}
.placeholder-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  opacity: 0.2;
}

.details-header {
  padding: 1.5rem 2rem 0;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-main);
  flex-shrink: 0;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.header-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  word-break: break-all;
  margin-right: 1rem;
  line-height: 1.3;
  color: var(--text-main);
}

.header-meta {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.method-text {
  font-weight: 700;
  color: var(--accent-color);
}

.separator {
  margin: 0 0.5rem;
  color: var(--text-tertiary);
}

.status-pill {
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
}
.status-pill.success { background-color: #dcfce7; color: #166534; border-color: #bbf7d0; }
.status-pill.warning { background-color: #fef3c7; color: #92400e; border-color: #fde68a; }
.status-pill.error { background-color: #fee2e2; color: #991b1b; border-color: #fecaca; }

/* Dark mode overrides for status pill (basic attempt based on possible classes, 
   though variables would be better if we had semantic color vars) */
:global(.theme-dark) .status-pill.success { background-color: rgba(34, 197, 94, 0.2); color: #4ade80; border-color: rgba(34, 197, 94, 0.3); }
:global(.theme-dark) .status-pill.warning { background-color: rgba(245, 158, 11, 0.2); color: #fbbf24; border-color: rgba(245, 158, 11, 0.3); }
:global(.theme-dark) .status-pill.error { background-color: rgba(239, 68, 68, 0.2); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }


.details-tabs {
  display: flex;
  gap: 2rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 0;
  font-size: 0.85rem;
  color: var(--text-tertiary);
  cursor: pointer;
  position: relative;
  font-weight: 500;
  transition: color 0.2s;
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.active {
  color: var(--accent-color);
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--accent-color);
}

.tab-count {
  background: var(--bg-tertiary);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  font-size: 0.65rem;
  margin-left: 0.3rem;
  vertical-align: middle;
}

.details-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.details-section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.key-value-table {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.table-header {
  display: flex;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.table-row {
  display: flex;
  font-size: 0.8rem;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.1s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: var(--bg-tertiary);
}

.col-key, .col-value {
  padding: 0.75rem 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-key {
  width: 35%;
  border-right: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 500;
}

.col-value {
  flex: 1;
  color: var(--text-main);
}

.col-key.mono {
  font-family: "JetBrains Mono", monospace;
  color: var(--accent-color);
}

.empty-pane.no-border {
  border: none;
  background: transparent;
  padding-left: 0;
  justify-content: flex-start;
  font-size: 0.85rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 1.25rem;
  border-radius: 8px;
}
.info-card.full-width {
    grid-column: span 2;
}

.info-card label {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.9rem;
  color: var(--text-main);
}
.info-value.big {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: "JetBrains Mono", monospace;
}
.info-value.code {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.8rem;
  word-break: break-all;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: var(--accent-color);
  cursor: pointer;
  display: block;
}
.link-btn:hover { text-decoration: underline; }

.source-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}



.pane-actions {
    margin-bottom: 1rem;
    display: flex;
    gap: 0.75rem;
}

.action-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    font-size: 0.75rem;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}
.override-btn {
    margin-left: auto;
    margin-right: 0.5rem;
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
}
.action-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-main);
    border-color: var(--text-tertiary);
}

.empty-pane {
    color: var(--text-tertiary);
    font-style: italic;
    text-align: center;
    padding: 3rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px dashed var(--border-color);
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem; /* Generous spacing between columns */
  margin-bottom: 2.5rem;
  align-items: start; /* Prevents tables from stretching if they have different heights */
}

/* Adjustment for mobile or when space is limited */
@media (max-width: 768px) {
  .params-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

/* Ensure that direct children of the grid (.details-section sections) do not have extra bottom margin inside the grid */
.params-grid .details-section {
  margin-bottom: 0;
}
</style>
