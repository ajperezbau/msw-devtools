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
      <svg
        class="msw-logo-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 128 128"
      >
        <g fill="none" fill-rule="nonzero">
          <rect width="128" height="128" fill="#000" rx="24"></rect>
          <path
            fill="#7A1818"
            d="M25.52 45.538a19.62 19.62 0 0 1 7.165-13.23 19.62 19.62 0 0 1 14.423-4.289 19.66 19.66 0 0 1 12.574 6.399l33.9 37.648a19.62 19.62 0 0 1 5.022 14.184 19.62 19.62 0 0 1-6.478 13.58 19.66 19.66 0 0 1-13.174 5.05L33 104.832a12.3 12.3 0 0 1-8.705-3.615 12.3 12.3 0 0 1-3.598-8.712v-.46zm18.508.746c-.346.28-.558.665-.605 1.113l-4.09 39.442 39.637.04c.36 0 .708-.115.993-.328l.119-.097c.337-.304.523-.701.547-1.146.023-.445-.12-.86-.424-1.197l-33.9-37.649a1.66 1.66 0 0 0-1.06-.54 1.63 1.63 0 0 0-1.217.362"
          ></path>
          <path
            fill="#FF6A33"
            d="m32.53 23.103 62.47.065a12.3 12.3 0 0 1 8.705 3.616 12.3 12.3 0 0 1 3.598 8.711v.461l-.048.459-6.484 62.477a12.3 12.3 0 0 1-4.49 8.287 12.315 12.315 0 0 1-16.912-1.322L23.367 43.66a12.3 12.3 0 0 1-3.146-8.885 12.315 12.315 0 0 1 12.31-11.67m12.767 18.012 38.89 43.192 4.478-43.147z"
          ></path>
        </g>
      </svg>
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

        <div class="search-container" v-if="activeTab === 'registry'">
          <div class="search-wrapper">
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Filter by key, URL or method..."
              class="search-input"
            />
            <button
              v-if="searchQuery"
              type="button"
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
            </button>
          </div>
          <div class="modified-filter">
            <MswCheckbox v-model="showOnlyModified">
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

        <div
          v-if="activeTab === 'registry' && isSelectionMode"
          class="selection-toolbar"
        >
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
              @keyup.enter="saveCurrentAsPreset"
            />
            <button
              @click="saveCurrentAsPreset"
              :disabled="!newPresetName || selectedKeys.size === 0"
              class="toolbar-save-button"
            >
              Save Selected
            </button>
          </div>
        </div>

        <div class="registry-container" v-if="activeTab === 'registry'">
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
                <td colspan="6" class="empty-state">
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
                      @click.stop="openOverrideEditor(key)"
                      class="icon-button"
                      :class="{ 'has-override': customOverrides[key]?.enabled }"
                      title="Custom response override"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      @click.stop="viewLogForKey(key)"
                      class="icon-button"
                      title="View logs for this handler"
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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

        <div class="presets-container" v-if="activeTab === 'presets'">
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
                          @click="applyPreset(selectedPreset.name)"
                          class="apply-preset-button compact"
                        >
                          Apply Preset
                        </button>
                        <button
                          v-if="selectedPreset.isCustom"
                          type="button"
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

        <div class="log-container" v-if="activeTab === 'log'">
          <div class="log-header">
            <div class="log-filters">
              <button
                v-for="method in [
                  'ALL',
                  'GET',
                  'POST',
                  'PUT',
                  'PATCH',
                  'DELETE',
                ]"
                :key="method"
                type="button"
                @click="toggleMethod(method)"
                class="method-toggle-btn"
                :class="{
                  active: selectedMethods.has(method),
                  [method.toLowerCase()]: true,
                }"
              >
                {{ method }}
              </button>
            </div>
          </div>

          <div v-if="logFilterKey" class="log-filter-banner">
            <span class="filter-info">
              Showing logs for: <strong>{{ logFilterKey }}</strong>
            </span>
            <button
              type="button"
              @click="logFilterKey = null"
              class="clear-filter-button"
            >
              Show All Logs
            </button>
          </div>

          <div v-if="filteredActivityLog.length === 0" class="empty-state">
            {{
              logFilterKey
                ? "No requests recorded for this handler."
                : "No requests recorded yet."
            }}
          </div>
          <div v-else class="log-list" role="list">
            <div
              v-for="entry in filteredActivityLog"
              :key="entry.id"
              class="log-entry"
              role="listitem"
              :class="{
                'is-expanded': expandedLogId === entry.id,
                'is-error': entry.status >= 400,
              }"
            >
              <div class="log-entry-header" @click="toggleLogEntry(entry.id)">
                <span class="log-time">{{ formatTime(entry.timestamp) }}</span>
                <span
                  class="method-badge"
                  :class="[entry.method.toLowerCase()]"
                  >{{ entry.method }}</span
                >
                <div class="log-url" :title="entry.url">
                  {{ entry.url }}
                </div>
                <div
                  v-if="entry.method !== 'GET' && entry.requestBody"
                  class="log-request-preview"
                  :title="JSON.stringify(entry.requestBody)"
                >
                  {{ formatPreview(entry.requestBody) }}
                </div>
                <div class="log-scenario-info">
                  <div class="log-key-wrapper">
                    <span class="log-key">{{ displayKey(entry.key) }}</span>
                    <span
                      v-if="scenarioRegistry[entry.key]?.isNative"
                      class="native-badge mini"
                      title="Native MSW handler"
                      >Native</span
                    >
                    <button
                      type="button"
                      @click.stop="viewHandlerForKey(entry.key)"
                      class="mini-icon-button"
                      title="View in Registry"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </button>
                  </div>
                  <span class="log-scenario">
                    {{ entry.scenario
                    }}{{
                      isCustomScenario(entry.key, entry.scenario) ? " ✨" : ""
                    }}
                  </span>
                </div>
                <span
                  class="status-badge"
                  :class="{ 'status-error': entry.status >= 400 }"
                >
                  {{ entry.status }}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="expand-icon h-4 w-4"
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
              </div>
              <div v-if="expandedLogId === entry.id" class="log-details">
                <div
                  class="json-search-bar"
                  v-if="entry.requestBody || entry.responseBody"
                >
                  <div class="json-search-container">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="search-icon h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      v-model="logSearchPath"
                      placeholder="Filter JSON (e.g. data.items.*.id)"
                      class="json-search-input"
                    />
                    <div class="json-help-wrapper">
                      <button type="button" class="json-help-icon">
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
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                      <div class="custom-tooltip">
                        <strong>JSON Path filtering:</strong>
                        <div>• Use <b>.</b> for nesting (e.g., data.id)</div>
                        <div>
                          • Use <b>[n]</b> or <b>.n</b> for array index (e.g.,
                          items[0])
                        </div>
                        <div>
                          • Use <b>*</b> to map over arrays/objects (e.g.,
                          items.*.name)
                        </div>
                      </div>
                    </div>
                    <button
                      v-if="logSearchPath"
                      type="button"
                      @click="logSearchPath = ''"
                      class="clear-json-search"
                      title="Clear filter"
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <section
                  v-if="entry.requestBody"
                  class="details-section"
                  aria-label="Request Body"
                >
                  <div class="details-header">
                    <h4 class="details-title">Request Body</h4>
                    <div class="details-actions">
                      <button
                        type="button"
                        @click="
                          copyToClipboard(
                            getFilteredJson(entry.requestBody, logSearchPath),
                          )
                        "
                        class="mini-action-button"
                        title="Copy to clipboard"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <pre class="details-content">{{
                    formatBody(
                      getFilteredJson(entry.requestBody, logSearchPath),
                    )
                  }}</pre>
                </section>
                <section
                  v-if="entry.responseBody"
                  class="details-section"
                  aria-label="Response Body"
                >
                  <div class="details-header">
                    <h4 class="details-title">Response Body</h4>
                    <div class="details-actions">
                      <button
                        type="button"
                        @click="
                          copyToClipboard(
                            getFilteredJson(entry.responseBody, logSearchPath),
                          )
                        "
                        class="mini-action-button"
                        title="Copy to clipboard"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        @click="openOverrideEditorFromLog(entry)"
                        class="mini-action-button"
                      >
                        Use as manual override
                      </button>
                    </div>
                  </div>
                  <pre class="details-content">{{
                    formatBody(
                      getFilteredJson(entry.responseBody, logSearchPath),
                    )
                  }}</pre>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import MswCheckbox from "./components/MswCheckbox.vue";
import {
  activityLog,
  applyPreset,
  clearActivityLog,
  customOverrides,
  customPresets,
  customScenarios,
  globalDelay,
  handlerDelays,
  presets,
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

const isAllSelected = computed({
  get: () => {
    if (filteredRegistryKeys.value.length === 0) return false;
    return filteredRegistryKeys.value.every((key) =>
      selectedKeys.value.has(key),
    );
  },
  set: (val) => {
    if (val) {
      filteredRegistryKeys.value.forEach((key) => selectedKeys.value.add(key));
    } else {
      filteredRegistryKeys.value.forEach((key) =>
        selectedKeys.value.delete(key),
      );
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
const searchInput = ref<HTMLInputElement | null>(null);
const expandedLogId = ref<string | null>(null);
const logFilterKey = ref<string | null>(null);
const selectedMethods = ref<Set<string>>(new Set(["ALL"]));
const logSearchPath = ref("");

const newPresetName = ref("");

const selectedPresetName = ref<string | null>(null);

// Constants for preset key prefixes
const PRESET_KEY_PREFIX_CUSTOM = 'custom:';
const PRESET_KEY_PREFIX_GLOBAL = 'global:';

// Helper to create unique preset key
const getPresetKey = (name: string, isCustom: boolean) => {
  return isCustom ? `${PRESET_KEY_PREFIX_CUSTOM}${name}` : `${PRESET_KEY_PREFIX_GLOBAL}${name}`;
};

// Helper to parse preset key back to name and type
// Currently unused but provided for future extensibility if needed
const parsePresetKey = (key: string) => {
  if (key.startsWith(PRESET_KEY_PREFIX_CUSTOM)) {
    return { name: key.slice(PRESET_KEY_PREFIX_CUSTOM.length), isCustom: true };
  }
  return { name: key.startsWith(PRESET_KEY_PREFIX_GLOBAL) ? key.slice(PRESET_KEY_PREFIX_GLOBAL.length) : key, isCustom: false };
};

const allPresets = computed(() => {
  return [
    ...presets.map((p) => ({ ...p, isCustom: false, key: getPresetKey(p.name, false) })),
    ...customPresets.map((p) => ({ ...p, isCustom: true, key: getPresetKey(p.name, true) })),
  ];
});

const selectedPreset = computed(() => {
  if (!selectedPresetName.value) return null;
  return allPresets.value.find((p) => p.key === selectedPresetName.value) || null;
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

const saveCurrentAsPreset = () => {
  if (!newPresetName.value.trim()) return;

  const scenarios: Record<string, string> = {};

  let keysToInclude: string[];
  if (isSelectionMode.value && selectedKeys.value.size > 0) {
    keysToInclude = Array.from(selectedKeys.value);
  } else {
    keysToInclude = Object.keys(scenarioRegistry);
  }

  keysToInclude.forEach((key) => {
    const val = scenarioState[key];
    if (val) {
      scenarios[key] = val;
    }
  });

  const name = newPresetName.value.trim();
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

  newPresetName.value = "";

  if (isSelectionMode.value) {
    isSelectionMode.value = false;
    selectedKeys.value.clear();
  }

  activeTab.value = "presets";
};

const deleteCustomPreset = (name: string) => {
  const index = customPresets.findIndex((p) => p.name === name);
  if (index !== -1) {
    customPresets.splice(index, 1);
  }
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

const toggleLogEntry = (id: string) => {
  expandedLogId.value = expandedLogId.value === id ? null : id;
};

const toggleMethod = (method: string) => {
  if (method === "ALL") {
    selectedMethods.value.clear();
    selectedMethods.value.add("ALL");
  } else {
    selectedMethods.value.delete("ALL");
    if (selectedMethods.value.has(method)) {
      selectedMethods.value.delete(method);
      if (selectedMethods.value.size === 0) {
        selectedMethods.value.add("ALL");
      }
    } else {
      selectedMethods.value.add(method);
    }
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

/**
 * Basic JSON filter using dot notation, array indices and * wildcard
 */
const getFilteredJson = (data: unknown, path: string) => {
  if (!path || !data || typeof data !== "object") return data;

  // Normalize path: items[0].id -> items.0.id
  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1").replace(/^\./, "");
  const parts = normalizedPath.split(".").filter(Boolean);

  const navigate = (current: unknown, segments: string[]): unknown => {
    if (segments.length === 0) return current;
    if (!current || typeof current !== "object") return undefined;

    const [head, ...tail] = segments;

    if (head === "*") {
      if (Array.isArray(current)) {
        const results = current
          .map((item) => navigate(item, tail))
          .filter((v) => v !== undefined);
        return results.length > 0 ? results : undefined;
      } else {
        const results: Record<string, unknown> = {};
        const entries = Object.entries(current as Record<string, unknown>);
        for (const [key, val] of entries) {
          const value = navigate(val, tail);
          if (value !== undefined) results[key] = value;
        }
        return Object.keys(results).length > 0 ? results : undefined;
      }
    }

    // Support both objects and array indices (current[0])
    if (head === undefined) return current;
    return navigate((current as Record<string, unknown>)[head], tail);
  };

  const result = navigate(data, parts);
  return result !== undefined ? result : "No matches found";
};

const formatBody = (body: unknown) => {
  if (body === undefined || body === null) return "";
  if (typeof body === "string") return body;
  return JSON.stringify(body, null, 2);
};

const formatPreview = (body: unknown) => {
  if (body === undefined || body === null) return "";
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return text.length > 60 ? text.substring(0, 60) + "..." : text;
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const copyToClipboard = async (data: unknown) => {
  try {
    const text =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(text);
    // Optional: show some temporary success state if needed
  } catch {
    // Fail silently or handle error
  }
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
  searchInput.value?.focus();
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

const filteredRegistryKeys = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return Object.keys(scenarioRegistry).filter((key) => {
    const metadata = scenarioRegistry[key];
    if (!metadata) return false;

    // Filter by modified status if enabled
    if (showOnlyModified.value && !isModified(key)) {
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

const filteredActivityLog = computed(() => {
  return activityLog.filter((entry) => {
    const matchesKey = !logFilterKey.value || entry.key === logFilterKey.value;
    const matchesMethod =
      selectedMethods.value.has("ALL") ||
      selectedMethods.value.has(entry.method);
    return matchesKey && matchesMethod;
  });
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

.log-container {
  flex: 1;
  overflow-y: auto;
  background-color: var(--bg-secondary);
  display: flex;
  flex-direction: column;
}

.log-header {
  padding: 0.75rem 1.5rem;
  background-color: var(--bg-main);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.log-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.method-toggle-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-tertiary);
  background-color: var(--bg-main);
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
}

.method-toggle-btn:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--text-tertiary);
}

.method-toggle-btn.active {
  border-color: transparent;
}

.method-toggle-btn.active.all {
  background-color: var(--bg-tertiary);
  color: var(--text-main);
}
.method-toggle-btn.active.get {
  background-color: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}
.method-toggle-btn.active.post {
  background-color: rgba(234, 179, 8, 0.2);
  color: #facc15;
}
.method-toggle-btn.active.put {
  background-color: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}
.method-toggle-btn.active.patch {
  background-color: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}
.method-toggle-btn.active.delete {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.theme-light .method-toggle-btn.active.get {
  background-color: #dcfce7;
  color: #166534;
}
.theme-light .method-toggle-btn.active.post {
  background-color: #fef9c3;
  color: #854d0e;
}
.theme-light .method-toggle-btn.active.put {
  background-color: #dbeafe;
  color: #1e40af;
}
.theme-light .method-toggle-btn.active.patch {
  background-color: #f3e8ff;
  color: #6b21a8;
}
.theme-light .method-toggle-btn.active.delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.log-filter-banner {
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-soft);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-info {
  font-size: 0.875rem;
  color: var(--accent-color);
  font-weight: 600;
}

.clear-filter-button {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-color);
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filter-button:hover {
  border-color: var(--accent-color);
  background-color: var(--bg-tertiary);
}

.log-list {
  display: flex;
  flex-direction: column;
}

.log-entry {
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-main);
}

.log-entry.is-error {
  border-left: 4px solid #ef4444;
}

.log-entry-header {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.1s;
}

.log-entry-header:hover {
  background-color: var(--table-hover);
}

.log-time {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  width: 80px;
}

.log-url {
  flex: 1;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.8125rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-request-preview {
  font-family: inherit;
  font-size: 0.75rem;
  color: var(--text-secondary);
  background-color: var(--bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 1rem;
  border: 1px solid var(--border-color);
}

.log-scenario-info {
  display: flex;
  flex-direction: column;
  width: 200px;
}

.log-key-wrapper {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.mini-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  border-radius: 0.25rem;
  background-color: transparent;
  color: var(--text-tertiary);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.log-entry-header:hover .mini-icon-button {
  color: var(--text-secondary);
  border-color: var(--border-color);
  background-color: var(--bg-tertiary);
}

.mini-icon-button:hover {
  background-color: var(--accent-soft) !important;
  color: var(--accent-color) !important;
  border-color: var(--accent-color) !important;
}

.log-key {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-main);
}

.log-scenario {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  background-color: #dcfce7;
  color: #166534;
  min-width: 40px;
  text-align: center;
}

.status-badge.status-error {
  background-color: #fee2e2;
  color: #991b1b;
}

.expand-icon {
  color: var(--text-tertiary);
  transition: transform 0.2s;
}

.is-expanded .expand-icon {
  transform: rotate(180deg);
}

.log-details {
  padding: 1rem;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.details-section {
  margin-bottom: 1rem;
}

.details-section:last-child {
  margin-bottom: 0;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.details-actions {
  display: flex;
  gap: 0.5rem;
}

.details-title {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-tertiary);
  margin-bottom: 0;
}

.mini-action-button {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mini-action-button:hover {
  background-color: var(--accent-hover);
}

.export-options-list {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
}

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

.primary-button {
  background-color: var(--accent-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.primary-button:hover {
  background-color: var(--accent-hover);
}

.secondary-button {
  background-color: var(--bg-main);
  color: var(--text-main);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  font-weight: 600;
  cursor: pointer;
}

.secondary-button:hover {
  background-color: var(--bg-tertiary);
}

.icon-button.has-override {
  color: #fbbf24;
  background-color: rgba(251, 191, 36, 0.1);
}

.override-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #fbbf24;
  color: #1a1a1a;
  font-size: 10px;
  font-weight: 800;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.details-content {
  margin: 0;
  padding: 0.75rem;
  background-color: var(--bg-tertiary);
  color: var(--text-main);
  border-radius: 0.5rem;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 0.75rem;
  overflow-x: auto;
  white-space: pre-wrap;
  max-height: 400px;
  border: 1px solid var(--border-color);
}

.theme-dark .details-content {
  background-color: #121212;
}

.icon-button {
  color: var(--text-tertiary);
  padding: 0.4rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--accent-color);
}

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

.apply-preset-button {
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

.apply-preset-button:hover {
  background-color: var(--accent-hover);
}

.apply-preset-button.compact {
  padding: 0.4rem 0.75rem;
  font-size: 0.8125rem;
}

.delete-preset-button {
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

.delete-preset-button:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.theme-dark .delete-preset-button:hover {
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
