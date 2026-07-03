<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { gamesApi } from '../services/games'
import type { GameDetail } from '../services/types'
import { useAuthStore } from '../stores/auth'
import MarkdownText from '../components/MarkdownText.vue'

const props = defineProps<{ slug: string }>()
const auth = useAuthStore()
const router = useRouter()

const game = ref<GameDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    game.value = await gamesApi.getBySlug(props.slug)
  } catch {
    error.value = 'Spel niet gevonden.'
  } finally {
    loading.value = false
  }
}

async function remove() {
  if (!game.value) return
  if (!confirm(`"${game.value.name}" verwijderen?`)) return
  await gamesApi.remove(game.value.id)
  router.push({ name: 'home' })
}

onMounted(load)
</script>

<template>
  <p v-if="loading" class="text-gray-400">Laden…</p>
  <p v-else-if="error" class="text-red-400">{{ error }}</p>

  <article v-else-if="game">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <RouterLink to="/" class="text-sm text-gray-400 hover:text-accent">← Terug</RouterLink>
        <h1 class="mt-1 text-3xl font-bold">{{ game.name }}</h1>
        <p v-if="game.description" class="mt-1 text-gray-400">{{ game.description }}</p>
        <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          <span v-if="game.minPlayers && game.maxPlayers">
            {{ game.minPlayers }}–{{ game.maxPlayers }} spelers
          </span>
          <span v-if="game.playTimeMinutes">· {{ game.playTimeMinutes }} min</span>
        </div>
      </div>
      <div v-if="auth.isAuthenticated" class="flex shrink-0 gap-2">
        <RouterLink class="btn-ghost" :to="{ name: 'game-edit', params: { slug: game.slug } }">
          Bewerken
        </RouterLink>
        <button class="btn-ghost text-red-400" @click="remove">Verwijderen</button>
      </div>
    </div>

    <section v-for="section in game.sections" :key="section.id" class="mb-6">
      <h2 class="mb-2 text-xl font-semibold text-accent">{{ section.title }}</h2>
      <MarkdownText v-if="section.body" :text="section.body" class="mb-3" />

      <div v-if="section.items.length" class="grid gap-3 sm:grid-cols-2">
        <div v-for="item in section.items" :key="item.id" class="card">
          <h3 class="font-semibold">{{ item.title }}</h3>
          <MarkdownText :text="item.body" class="mt-1" />
        </div>
      </div>
    </section>

    <p v-if="game.sections.length === 0" class="text-gray-500">Nog geen regels toegevoegd.</p>
  </article>
</template>
