# Copilot Instructions

## Terminal & Commands

- **Package Manager:** Always use `pnpm` for all package management tasks (installing, adding, removing, or running scripts). Never use `npm` or `yarn`.
- When running Playwright tests, always use the `--reporter=line` or `--reporter=list` flag to prevent the reporter from hanging the terminal with an interactive HTML report on failure.
- Example: `pnpm playwright test --reporter=line`
- Do not use commands that require user intervention to terminate unless specifically requested.

## Testing Guidelines

- **Semantic Locators:** Prefer using Playwright's semantic locators like `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, or `getByTestId` over CSS classes or ID-based locators. This ensures better accessibility and test robustness.
- **Role usage:** When targetting elements, use their ARIA roles (e.g., `heading`, `button`, `row`, `cell`, `textbox`).

## State Management & Configuration

- **Export/Import Consistency:** When adding new persistent configuration or state (like Presets, Scenarios, or Overrides), always ensure it is included in the Export and Import processes in `mswDevtools.vue`.
- **Persistence Visibility:** Ensure that any user-created content (Custom Scenarios, Presets) is correctly reactive and persisted to `localStorage` via the handlers in `mswRegistry.ts`.

## Architecture Alignment

- **Architecture First:** Always follow the rules and constraints documented in `ARCHITECTURE.md`.
