<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <header class="border-b border-border bg-card/60 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <RouterLink to="/" class="flex items-center gap-2 text-lg font-bold">
          <span>🎲</span>
          <span>Speluitleg</span>
        </RouterLink>
        <nav class="flex items-center gap-3 text-sm">
          <template v-if="auth.isAuthenticated">
            <RouterLink class="btn-primary" :to="{ name: 'game-new' }">Nieuw spel</RouterLink>
            <span class="hidden text-gray-400 sm:inline">{{ auth.displayName }}</span>
            <button class="btn-ghost" @click="logout">Uitloggen</button>
          </template>
          <template v-else>
            <RouterLink class="btn-ghost" :to="{ name: 'login' }">Inloggen</RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <RouterView />
    </main>

    <footer class="border-t border-border py-6 text-center text-xs text-gray-500">
      Speluitleg — versimpelde spelregels
    </footer>
  </div>
</template>
