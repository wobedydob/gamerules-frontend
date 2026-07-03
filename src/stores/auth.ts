import { defineStore } from 'pinia'
import { api, getToken, setToken } from '../services/api'
import type { AuthResponse } from '../services/types'

interface AuthState {
  token: string | null
  email: string | null
  displayName: string | null
  roles: string[]
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: getToken(),
    email: null,
    displayName: null,
    roles: [],
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
    isAdmin: (s) => s.roles.includes('Admin'),
  },
  actions: {
    apply(res: AuthResponse) {
      this.token = res.token
      this.email = res.email
      this.displayName = res.displayName
      this.roles = res.roles
      setToken(res.token)
    },

    async login(email: string, password: string) {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
      this.apply(data)
    },

    async register(email: string, password: string, displayName: string) {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        email,
        password,
        displayName,
      })
      this.apply(data)
    },

    /** Restore session from a stored token on app start. */
    async loadMe() {
      if (!this.token) return
      try {
        const { data } = await api.get<AuthResponse>('/auth/me')
        this.apply(data)
      } catch {
        this.logout()
      }
    },

    logout() {
      this.token = null
      this.email = null
      this.displayName = null
      this.roles = []
      setToken(null)
    },
  },
})
