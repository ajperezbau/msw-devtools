import { createApp } from "vue";
import { MswDevtoolsPlugin, defineHandlers } from "./index";
import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";

const app = createApp({});

// Define some example handlers to test
defineHandlers({
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
  http.get("/api/status", () => {
    return HttpResponse.json({ status: "ok", timestamp: Date.now() });
  }),
  http.post("/api/status", () => {
    return HttpResponse.json({ success: true });
  }),
);
await worker.start();

app.use(MswDevtoolsPlugin, { worker });
app.mount("#app");
