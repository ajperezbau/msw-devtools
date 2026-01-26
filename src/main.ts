import { createApp } from "vue";
import { MswDevtoolsPlugin } from "./index";

const app = createApp({});
app.use(MswDevtoolsPlugin);
app.mount("#app");
