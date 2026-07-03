import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
app.use(createPinia())

// Apply the persisted / preferred theme before first paint.
useThemeStore().init()

// Restore session before mounting so guards see the right auth state.
const auth = useAuthStore()
auth.loadMe().finally(() => {
  app.use(router)
  app.mount('#app')
})
