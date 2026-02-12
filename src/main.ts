import { createApp, h } from "vue";
import { MswDevtoolsPlugin, defineHandlers } from "./index";
import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";

const app = createApp({
  render: () => h("div", "MSW Devtools Test Environment"),
});

// Define some example handlers to test
const devtoolsHandlers = defineHandlers({
  users: {
    url: "/api/users",
    method: "get",
    scenarios: {
      default: () => {
        return HttpResponse.json([{ id: 1, name: "John" }]);
      },
      empty: () => {
        return HttpResponse.json([]);
      },
    },
  },
  products: {
    url: "/api/products",
    method: "post",
    scenarios: {
      default: () => {
        return HttpResponse.json({ success: true, id: 123 }, { status: 201 });
      },
    },
  },
});

const worker = setupWorker(
  ...devtoolsHandlers,
  http.get("/api/status", () => {
    return HttpResponse.json({ status: "ok", timestamp: Date.now() });
  }),
  http.post("/api/status", () => {
    return HttpResponse.json({ success: true });
  }),
  // Handler with RegExp path to test auto-discovery robustness
  http.get(/\/api\/regex-test/, () => {
    return HttpResponse.json({ regex: true });
  }),
  // Handler with "all" method (might have different info)
  http.all("/api/all-test", () => {
    return HttpResponse.json({ all: true });
  }),
);
await worker.start();

app.use(MswDevtoolsPlugin, { worker });
app.mount("#app");
