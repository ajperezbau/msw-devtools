# Vue MSW DevTools

A powerful browser-based UI for managing [Mock Service Worker (MSW)](https://mswjs.io/) handlers in Vue 3 applications. This library allows you to dynamically switch between different response scenarios, override responses on the fly, and inspect network activity handled by MSW.

## Features

- 🛠 **Dynamic Scenario Switching**: Define multiple response scenarios for a single endpoint and switch between them without reloading.
- 🌐 **Passthrough Mode**: Instantly bypass mocks and forward requests to the real API. Toggle globally (saving your previous mock states) or set it per-handler.
- ⏺️ **Response Recording**: Opt-in recording mode to capture and inspect real API responses directly in the Activity Log.
- ✍️ **Manual Overrides**: Edit response status codes and bodies (JSON or Text) directly in the browser.
- ⏱ **Network Simulation**: Set global or per-handler delays to simulate different network conditions.
- 📋 **Activity Log**: View a history of all requests handled by MSW, including request/response bodies with JSON path filtering.
- 🔌 **Zero-Config Discovery**: Automatically detects existing MSW handlers without changing your code.
- 💾 **Persistence**: All your settings (active scenarios, delays, overrides) are persisted in `localStorage`.
- 🔗 **URL Parameters Sync**: Deep-link to specific mock scenarios using URL query parameters.
- ✨ **Custom Scenarios**: Save manual overrides as reusable custom scenarios.
- 🍱 **Presets**: Group multiple handler scenarios into "Recipes" to replicate complex application flows.

## Installation

```bash
npm install @ajperezbau/vue-msw-devtools
# or
pnpm add @ajperezbau/vue-msw-devtools
```

## Setup

### Step-by-Step Integration

You can integrate the devtools with a single line in your application entry point:

```typescript
import { createApp } from "vue";
import { setupWorker } from "msw/browser";
import { MswDevtoolsPlugin } from "@ajperezbau/vue-msw-devtools";
import App from "./App.vue";

const app = createApp(App);

// 1. Setup MSW as usual
const worker = setupWorker();
await worker.start();

// 2. Install the plugin — worker is required
if (process.env.NODE_ENV === "development") {
  app.use(MswDevtoolsPlugin, {
    worker, // required
    // Optional: useful to modify the URLs as needed
    urlResolver: (url) => new URL(url, "https://some-base-url").toString(),
  });
}

app.mount("#app");
```

### Zero Config Discovery

The plugin automatically detects any existing handlers you have already registered in your MSW worker. They will appear in the DevTools UI under a default scenario named "default", allowing you to immediately:

- Set delays for existing handlers.
- See them in the Activity Log.
- Apply manual overrides.

No changes are needed to your existing MSW code beyond the initial setup!

## Defining Handlers

Use `defineHandlers` to create handlers with multiple scenarios, then pass them to your MSW worker.

```typescript
import { defineHandlers } from "@ajperezbau/vue-msw-devtools";
import { setupWorker } from "msw/browser";
import { HttpResponse } from "msw";

// Define handlers with multiple scenarios
const devtoolsHandlers = defineHandlers({
  users: {
    url: "/api/users",
    method: "get",
    scenarios: {
      success: () => HttpResponse.json([{ id: 1, name: "John" }]),
      empty: () => HttpResponse.json([]),
      error: () => new HttpResponse(null, { status: 500 }),
    },
  },
});

// Pass the handlers to MSW worker
const worker = setupWorker(...devtoolsHandlers);
await worker.start();
```

#### Why `defineHandlers`?

While **Zero Config Discovery** is great for getting started, using `defineHandlers` offers several key advantages:

- 🏗 **Multiple Scenarios**: Auto-discovery only captures the "original" behavior. `defineHandlers` allows you to define multiple states (e.g., `success`, `error`, `loading`) for the same endpoint.
- 🏷 **Custom Labeling**: Instead of seeing `[GET] /api/very/long/path/to/users`, you can identify the handler with a simple, readable key like `users`.
- 🎯 **Preset Integration**: Readable keys make it much easier to define and manage Presets in your codebase.
- ⚙️ **Default Scenarios**: Specify which scenario should be active when the application starts.
- 🔝 **Explicit Priority**: Fine-tune the matching order for overlapping routes.

### Advanced Usage

#### Priority Handling

Handlers with higher priority will be matched first by MSW. Use the `priority` property in the handler configuration.

```typescript
const handlers = defineHandlers({
  getUserAdmin: {
    url: "/api/user/admin",
    method: "get",
    priority: 10,
    scenarios: {
      default: () => HttpResponse.json({ role: "admin" }),
    },
  },
});

// Pass to MSW
const worker = setupWorker(...handlers);
```

### Global Presets (Recipes)

Sometimes you want to set the state of multiple handlers at once to replicate a specific application flow (e.g., "First Time Journey", "Subscription Expired", "Admin Dashboard").

#### Defining Presets in Code

Use `definePresets` to register predefined configurations.

```typescript
import { definePresets } from "@ajperezbau/vue-msw-devtools";

definePresets([
  {
    name: "New User Journey",
    description:
      "Sets all user-related handlers to 'empty' or 'first-time' scenarios",
    scenarios: {
      users: "empty",
      profile: "first-login",
      notifications: "none",
    },
  },
  {
    name: "Happy Path - Premium",
    scenarios: {
      users: "success",
      billing: "active-subscription",
    },
  },
]);
```

#### Creating Presets from UI

The easiest way to create a preset is directly from the **Registry** tab:

1. Click the **Create Preset** icon (list icon) in the top-right toolbar.
2. Select the handlers you want to include (you can use the "Select Visible" checkbox in the header or click individual rows).
3. Adjust the active scenarios for the selected handlers if needed.
4. Enter a name in the selection toolbar and click **Save Selected**.

The app will automatically switch to the **Presets** tab where you can see and apply your new group.

These presets are persisted in `localStorage` and can be exported/imported along with your other configurations.

#### Global Delay

You can control network latency globally or per handler from the Devtools UI.

## UI Usage

Once installed, a floating gear icon will appear in your application.

- **Global Passthrough**: Click the globe icon in the header to instantly bypass all mocks (Real API mode). The tool takes a smart snapshot of your active scenarios and restores them when you disable the passthrough.
- **Record Passthrough**: When passthrough is active, a red record button appears. Enabling it captures the real API responses so you can inspect them in the Activity Log or easily save them as new manual overrides. _(Note: This duplicates requests in the browser's native Network tab)._
- **Registry Tab**: View all registered handlers, change active scenarios, set individual delays, and create **Presets** using selective grouping.
- **Activity Log Tab**: See real-time request logs. Click on an entry to inspect request/response bodies.
- **Presets Tab**: View and apply saved groups of scenarios ("Recipes") to instantly change your app's state.
- **Manual Override**: Click the edit icon on any handler to manually define a fixed response.
- **Apply & Reload**: Some changes might require a page reload to ensure consistency.

## Keyboard Shortcuts

- `Ctrl + Shift + M`: Toggle Devtools panel.
- `Ctrl + Enter`: Apply changes and reload page (when panel is open).

## Development

This project uses `pnpm` as its package manager. Please ensure you have it installed before contributing.

```bash
pnpm install
pnpm dev
pnpm test
```
