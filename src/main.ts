import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { detectLocale, i18n, setLocale } from './i18n'
import { router } from './router'
import './style.css'

// Load the visitor's language before the first paint so nobody sees English flash by.
await setLocale(detectLocale(), false)

createApp(App).use(createPinia()).use(i18n).use(router).mount('#app')
