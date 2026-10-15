import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { detectLocale, i18n, setLocale } from './i18n'
import { router } from './router'
// Self-hosted fonts: no third-party requests (privacy/GDPR), and a strict CSP.
import '@fontsource-variable/archivo/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './style.css'

// Load the visitor's language before the first paint so nobody sees English flash by.
await setLocale(detectLocale())

createApp(App).use(createPinia()).use(i18n).use(router).mount('#app')
