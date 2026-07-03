<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { gamesApi } from '../services/games'
import type { GameSummary } from '../services/types'
import CoverImage from '../components/CoverImage.vue'

const games = ref<GameSummary[]>([])
const search = ref('')
const loading = ref(true)
const error = ref<string | null>(null)

// Client-side filters (design: players + play-time buckets).
const playersFilter = ref<number | null>(null)
const timeFilter = ref<string | null>(null)

const PLAYER_CHIPS = [
  { label: '1–2', value: 2 },
  { label: '3–4', value: 4 },
  { label: '5+', value: 5 },
]
const TIME_CHIPS = [
  { label: '< 15 min', value: 'short' },
  { label: '15–30 min', value: 'mid' },
  { label: '30+ min', value: 'long' },
]

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
  debounce = setTimeout(load, 150)
})

function matchesPlayers(g: GameSummary): boolean {
  if (playersFilter.value === null) return true
  const min = g.minPlayers ?? 1
  const max = g.maxPlayers ?? min
  if (playersFilter.value === 5) return max >= 5
  // Chip value is the upper bound of its bucket; a game matches if its range overlaps.
  const lo = playersFilter.value === 2 ? 1 : 3
  const hi = playersFilter.value
  return min <= hi && max >= lo
}

function matchesTime(g: GameSummary): boolean {
  if (timeFilter.value === null) return true
  const t = g.playTimeMinutes
  if (t == null) return false
  if (timeFilter.value === 'short') return t < 15
  if (timeFilter.value === 'mid') return t >= 15 && t <= 30
  return t > 30
}

const filtered = computed(() =>
  games.value.filter((g) => matchesPlayers(g) && matchesTime(g)),
)

function togglePlayers(v: number) {
  playersFilter.value = playersFilter.value === v ? null : v
}
function toggleTime(v: string) {
  timeFilter.value = timeFilter.value === v ? null : v
}

function players(g: GameSummary): string | null {
  if (g.minPlayers && g.maxPlayers) return `${g.minPlayers}–${g.maxPlayers}`
  if (g.minPlayers) return `${g.minPlayers}+`
  return null
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-3xl font-extrabold text-ink">Spellen</h1>
      <p class="mt-1 text-muted">Versimpelde spelregels — snel opzoeken aan tafel.</p>
    </div>

    <!-- Search -->
    <div class="relative mb-4">
      <Search
        class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
        :size="18"
      />
      <input v-model="search" class="input pl-11" placeholder="Zoek een spel…" />
    </div>

    <!-- Filter chips -->
    <div class="mb-7 flex flex-wrap gap-2">
      <button
        v-for="c in PLAYER_CHIPS"
        :key="'p' + c.value"
        class="chip border transition-colors"
        :class="
          playersFilter === c.value
            ? 'border-transparent bg-tint text-accent'
            : 'border-card-line bg-card text-muted hover:border-accent'
        "
        @click="togglePlayers(c.value)"
      >
        {{ c.label }} spelers
      </button>
      <button
        v-for="c in TIME_CHIPS"
        :key="'t' + c.value"
        class="chip border transition-colors"
        :class="
          timeFilter === c.value
            ? 'border-transparent bg-tint text-accent'
            : 'border-card-line bg-card text-muted hover:border-accent'
        "
        @click="toggleTime(c.value)"
      >
        {{ c.label }}
      </button>
    </div>

    <p v-if="loading" class="text-muted">Laden…</p>
    <p v-else-if="error" class="text-accent">{{ error }}</p>
    <p v-else-if="filtered.length === 0" class="text-muted">Geen spellen gevonden.</p>

    <!-- Game grid: 1 / 2 / 3 / 4 columns -->
    <div
      v-else
      class="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-4"
    >
      <RouterLink
        v-for="g in filtered"
        :key="g.id"
        :to="{ name: 'game-detail', params: { slug: g.slug } }"
        class="card group overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lift"
      >
        <div class="aspect-video overflow-hidden">
          <CoverImage :src="g.imageUrl" :alt="g.name" />
        </div>
        <div class="p-3">
          <h2 class="font-semibold text-ink">{{ g.name }}</h2>
          <p v-if="g.description" class="mt-0.5 line-clamp-1 text-xs text-muted">
            {{ g.description }}
          </p>
          <div class="mt-2.5 flex flex-wrap gap-1.5">
            <span v-if="players(g)" class="chip-players">{{ players(g) }}</span>
            <span v-if="g.playTimeMinutes" class="chip-time">{{ g.playTimeMinutes }} min</span>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
