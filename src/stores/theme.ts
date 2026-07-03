import { defineStore } from 'pinia'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'regelhulp-theme'

function initialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', {
  state: () => ({ theme: 'light' as Theme }),
  getters: {
    isDark: (s) => s.theme === 'dark',
  },
  actions: {
    apply() {
      document.documentElement.classList.toggle('dark', this.theme === 'dark')
    },
    init() {
      this.theme = initialTheme()
      this.apply()
    },
    toggle() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, this.theme)
      this.apply()
    },
  },
})
