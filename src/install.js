import * as components from "./components";

const Components = (Vue, options = {}) => {
  for (let key in components) {
    let _key = options.prefix ? options.prefix + key : key;
    Vue.component(_key, components[key]);
  }
};

if (typeof window !== "undefined" && window.Vue) {
  Components(window.Vue);
}

export { Components };
