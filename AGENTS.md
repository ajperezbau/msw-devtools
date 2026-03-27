# AGENTS Guide

## Project Mental Model
- This package ships a framework-agnostic custom element (`<msw-devtools>`) that controls MSW handlers at runtime.
- Entry point is `src/index.ts`: `initMswDevtools({ worker, urlResolver? })` wires the worker and mounts the custom element.
- Handler orchestration lives in `src/mswRegistry.ts` (single source of truth for runtime state + persistence).
- UI orchestration lives in `src/mswDevtools.ce.vue` (tabs, modals, reset flows, export/import, passthrough controls).
## Architecture You Must Preserve
- Keep shared state in `src/mswRegistry.ts` using Vue `reactive`/`ref`; do not introduce Pinia/Vuex (`ARCHITECTURE.md`).
- Keep shared data contracts in `src/types.ts` (e.g. `Preset`, `CustomScenario`, `ExportOptions`).
- Root component coordinates children via emits (`RegistryView`, `PresetsView`, `ActivityLogView`, `OverrideEditor`).
- Use CSS variables + scoped component styles; no Tailwind/external UI libs (`ARCHITECTURE.md`).
## MSW Integration Patterns
- `defineHandlers()` in `src/mswRegistry.ts` attaches `__vueDevtoolsConfig` metadata; `setupMswRegistry()` consumes it later.
- `setupMswRegistry()` also auto-discovers native worker handlers via `worker.listHandlers()` and registers them as keys like `[GET] /api/status`.
- `refreshHandlers()` sorts by `priority` desc and calls `worker.resetHandlers(...devtoolsHandlers, ...baseHandlers)`.
- Built-in scenarios include `passthrough` and `ServerError`; avoid breaking these names.
## Persistence & Import/Export Rules (critical)
- Persisted state keys are in `src/mswRegistry.ts` (`msw-scenarios`, `msw-handler-delays`, `msw-overrides`, etc.).
- If you add new user-persistent state, update all of these places:
  1) reactive/ref initialization in `src/mswRegistry.ts`
  2) `watch(...)` persistence in `src/mswRegistry.ts`
  3) export payload in `exportScenarios()` (`src/mswDevtools.ce.vue`)
  4) import handling in `handleImport()` (`src/mswDevtools.ce.vue`)
  5) full reset flow in `clearConfigs()` (`src/mswDevtools.ce.vue`)
- Keep migration behavior aligned with `normalizeStorageData()` when changing legacy values.
## Developer Workflows
- Package manager is `pnpm` only (`package.json` preinstall enforces it).
- Common commands:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm test` (already uses non-interactive reporter)
  - `pnpm playwright test --reporter=line` (preferred for ad-hoc runs)
- Playwright config (`playwright.config.ts`) starts app with `pnpm dev` and uses base URL `http://localhost:5173`.
## Testing Conventions In This Repo
- Follow page-object style in `tests/page-objects/DevToolsPage.ts`.
- Prefer semantic locators (`getByRole`, `getByLabel`, `getByPlaceholder`) over CSS selectors.
- When changing labels/ARIA names in UI, update locators in `DevToolsPage` and related specs.
- For passthrough/export/import changes, cover `tests/passthrough.spec.ts` and `tests/export-import.spec.ts` patterns.
## Fast File Map By Task
- Public API / mounting: `src/index.ts`
- Runtime state, handlers, persistence: `src/mswRegistry.ts`
- Shell UI + cross-tab orchestration: `src/mswDevtools.ce.vue`
- Shared types: `src/types.ts`
- Architecture constraints: `ARCHITECTURE.md`
- User-level behavior and examples: `README.md`
