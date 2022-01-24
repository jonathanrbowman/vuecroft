import Vue from "vue";

const Components = require.context("@/components", true, /\.(js|vue)$/i);

Components.keys().map((path) => {
  let componentName = path.substring(path.lastIndexOf("/") + 1).split(".")[0];
  return Vue.component(componentName, Components(path).default);
});
