<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { gamesApi } from '../services/games'
import type { GameSummary } from '../services/types'

const games = ref<GameSummary[]>([])
const search = ref('')
const loading = ref(true)
const error = ref<string | null>(null)

let debounce: ReturnType<typeof setTimeout>

async function load() {
  loading.value = true
  error.value = null
  try {
    games.value = await gamesApi.list(search.value.trim() || undefined)
  } catch {
    error.value = 'Kon de spellen niet laden.'
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  clearTimeout(debounce)
  debounce = setTimeout(load, 250)
})

onMounted(load)

function players(g: GameSummary): string | null {
  if (g.minPlayers && g.maxPlayers) return `${g.minPlayers}–${g.maxPlayers} spelers`
  if (g.minPlayers) return `${g.minPlayers}+ spelers`
  return null
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Spellen</h1>
      <p class="text-sm text-gray-400">Versimpelde spelregels — snel opzoeken aan tafel.</p>
    </div>

    <input v-model="search" class="input mb-6" placeholder="Zoek een spel…" />

    <p v-if="loading" class="text-gray-400">Laden…</p>
    <p v-else-if="error" class="text-red-400">{{ error }}</p>
    <p v-else-if="games.length === 0" class="text-gray-400">Geen spellen gevonden.</p>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="g in games"
        :key="g.id"
        :to="{ name: 'game-detail', params: { slug: g.slug } }"
        class="card transition-colors hover:border-accent"
      >
        <h2 class="text-lg font-semibold">{{ g.name }}</h2>
        <p v-if="g.description" class="mt-1 line-clamp-2 text-sm text-gray-400">
          {{ g.description }}
        </p>
        <div class="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          <span v-if="players(g)">{{ players(g) }}</span>
          <span v-if="g.playTimeMinutes">· {{ g.playTimeMinutes }} min</span>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
