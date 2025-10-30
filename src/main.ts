import { createApp } from "vue";
import { Quasar, Dialog, Notify } from "quasar";
import "@quasar/extras/material-icons/material-icons.css";
import "quasar/dist/quasar.css";
import App from "./App.vue";

const app = createApp(App);

app.use(Quasar, {
  plugins: {
    Dialog,
    Notify,
  },
  config: {
    notify: {},
  },
});

app.mount("#app");
