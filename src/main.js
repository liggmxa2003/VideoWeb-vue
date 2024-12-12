import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import {createPinia} from "pinia"
import {createPersistedState} from "pinia-persistedstate-plugin"

const app = createApp(App)
const pinia = createPinia()
const persist = createPersistedState();
// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
pinia.use(persist)
app.use(pinia)
app.use(ElementPlus)
app.use(router)
app.mount('#app') 