import { createApp } from "vue";
import { MswDevtoolsPlugin, MswHandlerBuilder } from "./index";
import { setupWorker } from "msw/browser";
import { http, HttpResponse } from "msw";

const app = createApp({});

// Define some example handlers to test
new MswHandlerBuilder("users")
  .url("/api/users")
  .method("get")
  .scenario("default", () => {
    return HttpResponse.json([{ id: 1, name: "John" }]);
  })
  .scenario("empty", () => {
    return HttpResponse.json([]);
  })
  .build();

new MswHandlerBuilder("products")
  .url("/api/products")
  .method("post")
  .scenario("default", () => {
    return HttpResponse.json({ success: true, id: 123 }, { status: 201 });
  })
  .build();

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
