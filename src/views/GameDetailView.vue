<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowLeft, Pencil, Search, Trash2, Users, Clock } from 'lucide-vue-next'
import { gamesApi } from '../services/games'
import type { GameDetail, Section } from '../services/types'
import { useAuthStore } from '../stores/auth'
import { sectionKind } from '../components/sectionMeta'
import CoverImage from '../components/CoverImage.vue'
import MarkdownText from '../components/MarkdownText.vue'

const props = defineProps<{ slug: string }>()
const auth = useAuthStore()
const router = useRouter()

const game = ref<GameDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const itemQuery = ref('')
const activeId = ref<number | null>(null)
let observer: IntersectionObserver | null = null

async function load() {
  loading.value = true
  error.value = null
  try {
    game.value = await gamesApi.getBySlug(props.slug)
    activeId.value = game.value.sections[0]?.id ?? null
  } catch {
    error.value = 'Spel niet gevonden.'
  } finally {
    loading.value = false
  }
}

// Filter items within the game (in-game search).
function filterItems(section: Section) {
  const q = itemQuery.value.trim().toLowerCase()
  if (!q) return section.items
  return section.items.filter(
    (i) => i.title.toLowerCase().includes(q) || i.body.toLowerCase().includes(q),
  )
}

const visibleSections = computed(() => {
  if (!game.value) return []
  const q = itemQuery.value.trim().toLowerCase()
  if (!q) return game.value.sections
  return game.value.sections.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      (s.body?.toLowerCase().includes(q) ?? false) ||
      filterItems(s).length > 0,
  )
})

function setupObserver() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length) {
        activeId.value = Number(visible[0].target.getAttribute('data-section-id'))
      }
    },
    { rootMargin: '-140px 0px -65% 0px', threshold: 0 },
  )
  document.querySelectorAll('[data-section-id]').forEach((el) => observer!.observe(el))
}

// Rebuild the observer whenever the rendered section set changes.
watch(
  () => visibleSections.value.map((s) => s.id).join(','),
  async () => {
    await nextTick()
    setupObserver()
  },
)

watch(() => props.slug, load, { immediate: true })
onBeforeUnmount(() => observer?.disconnect())

function goToSection(id: number) {
  const el = document.getElementById(`section-${id}`)
  if (!el) return
  activeId.value = id
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 132, behavior: 'smooth' })
}

async function remove() {
  if (!game.value) return
  if (!confirm(`"${game.value.name}" verwijderen?`)) return
  await gamesApi.remove(game.value.id)
  router.push({ name: 'home' })
}
</script>

<template>
  <p v-if="loading" class="text-muted">Laden…</p>
  <p v-else-if="error" class="text-accent">{{ error }}</p>

  <article v-else-if="game">
    <RouterLink
      to="/"
      class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
    >
      <ArrowLeft :size="16" /> Alle spellen
    </RouterLink>

    <!-- Header -->
    <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
      <div class="h-20 w-20 shrink-0 overflow-hidden rounded-item border border-card-line">
        <CoverImage :src="game.imageUrl" :alt="game.name" />
      </div>
      <div class="min-w-0 flex-1">
        <h1 class="text-3xl font-extrabold leading-tight text-ink">{{ game.name }}</h1>
        <p v-if="game.description" class="mt-1 text-muted">{{ game.description }}</p>
        <div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-faint">
          <span v-if="game.minPlayers" class="inline-flex items-center gap-1.5">
            <Users :size="15" />
            {{ game.minPlayers }}<template v-if="game.maxPlayers">–{{ game.maxPlayers }}</template>
            spelers
          </span>
          <span v-if="game.playTimeMinutes" class="inline-flex items-center gap-1.5">
            <Clock :size="15" /> {{ game.playTimeMinutes }} min
          </span>
        </div>
      </div>
      <div v-if="auth.isAuthenticated" class="flex shrink-0 gap-2">
        <RouterLink class="btn-ghost" :to="{ name: 'game-edit', params: { slug: game.slug } }">
          <Pencil :size="15" /> <span class="hidden sm:inline">Bewerken</span>
        </RouterLink>
        <button class="btn-icon hover:!border-accent hover:!text-accent" title="Verwijderen" @click="remove">
          <Trash2 :size="16" />
        </button>
      </div>
    </header>

    <!-- In-game search -->
    <div v-if="game.sections.length" class="relative mb-6">
      <Search class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" :size="16" />
      <input v-model="itemQuery" class="input pl-10" placeholder="Zoek in dit spel…" />
    </div>

    <p v-if="!game.sections.length" class="text-faint">Nog geen regels toegevoegd.</p>

    <div v-else class="min-[900px]:grid min-[900px]:grid-cols-[190px_1fr] min-[900px]:gap-8">
      <!-- Section nav: sticky bar (mobile) / left rail (desktop) -->
      <nav
        class="no-scrollbar sticky top-14 z-30 -mx-5 mb-5 flex gap-1.5 overflow-x-auto border-b border-hair bg-surface/85 px-5 py-2.5 backdrop-blur min-[900px]:top-20 min-[900px]:mx-0 min-[900px]:mb-0 min-[900px]:h-fit min-[900px]:flex-col min-[900px]:overflow-visible min-[900px]:border-0 min-[900px]:bg-transparent min-[900px]:p-0 min-[900px]:backdrop-blur-none"
      >
        <button
          v-for="s in visibleSections"
          :key="s.id"
          class="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-left text-sm font-semibold transition-colors min-[900px]:rounded-item"
          :class="
            activeId === s.id
              ? 'bg-tint text-accent'
              : 'text-muted hover:text-accent'
          "
          @click="goToSection(s.id)"
        >
          {{ s.title }}
        </button>
      </nav>

      <!-- Sections -->
      <div class="min-w-0">
        <section
          v-for="section in visibleSections"
          :id="`section-${section.id}`"
          :key="section.id"
          :data-section-id="section.id"
          class="mb-10"
        >
          <div class="mb-3 flex items-center gap-3">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-tile"
              :class="
                section.type === 'cards'
                  ? 'border border-cat-line bg-cat text-cat-text'
                  : 'bg-tint text-accent'
              "
            >
              <component :is="sectionKind(section.title).icon" :size="18" />
            </span>
            <h2 class="text-xl font-extrabold text-ink">{{ section.title }}</h2>
            <span v-if="section.items.length" class="text-sm text-faint">
              {{ section.items.length }} {{ section.items.length === 1 ? 'regel' : 'regels' }}
            </span>
          </div>

          <MarkdownText v-if="section.body" :text="section.body" class="mb-4 max-w-2xl" />

          <!-- Card-grid mode ("Kaarten" sections) -->
          <div
            v-if="section.type === 'cards' && filterItems(section).length"
            class="grid grid-cols-2 gap-2.5 min-[900px]:grid-cols-3"
          >
            <div
              v-for="item in filterItems(section)"
              :key="item.id"
              class="rounded-item border border-chunky bg-card p-3 shadow-tactile"
            >
              <h3 class="text-sm font-extrabold text-ink">{{ item.title }}</h3>
              <MarkdownText :text="item.body" class="mt-1" />
            </div>
          </div>

          <!-- List mode (default) -->
          <div v-else-if="filterItems(section).length" class="max-w-2xl">
            <div
              v-for="item in filterItems(section)"
              :key="item.id"
              class="border-t border-hair py-3"
            >
              <div class="font-bold text-ink">{{ item.title }}</div>
              <MarkdownText :text="item.body" class="mt-0.5" />
            </div>
          </div>
        </section>
      </div>
    </div>
  </article>
</template>
