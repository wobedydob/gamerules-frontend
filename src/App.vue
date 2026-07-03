<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { Moon, Plus, Sun } from 'lucide-vue-next'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'

const auth = useAuthStore()
const theme = useThemeStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="flex min-h-full flex-col">
    <header class="sticky top-0 z-40 border-b border-hair bg-surface/85 backdrop-blur">
      <div class="mx-auto flex h-14 max-w-content items-center justify-between px-5">
        <RouterLink
          to="/"
          class="font-display text-xl font-extrabold tracking-tight text-ink"
        >
          regelhulp
        </RouterLink>

        <nav class="flex items-center gap-2">
          <button
            class="btn-icon"
            :title="theme.isDark ? 'Lichte modus' : 'Donkere modus'"
            @click="theme.toggle()"
          >
            <Sun v-if="theme.isDark" :size="18" />
            <Moon v-else :size="18" />
          </button>

          <template v-if="auth.isAuthenticated">
            <RouterLink class="btn-primary" :to="{ name: 'game-new' }">
              <Plus :size="16" />
              <span class="hidden sm:inline">Nieuw spel</span>
            </RouterLink>
            <button class="btn-ghost" @click="logout">Uitloggen</button>
          </template>
          <template v-else>
            <RouterLink class="btn-ghost" :to="{ name: 'login' }">Inloggen</RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-content flex-1 px-5 py-8">
      <RouterView />
    </main>

    <footer class="border-t border-hair py-6 text-center text-xs text-faint">
      regelhulp — versimpelde spelregels, snel opzoeken aan tafel
    </footer>
  </div>
</template>
