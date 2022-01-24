import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import { Components } from "./install";

Vue.config.productionTip = false;

Vue.use(Components);

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
