<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { gamesApi } from '../services/games'
import type { GameWrite, SectionWrite } from '../services/types'

const props = defineProps<{ slug?: string }>()
const router = useRouter()

const isEdit = ref(false)
const gameId = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

const form = reactive<GameWrite>({
  name: '',
  description: '',
  imageUrl: '',
  minPlayers: null,
  maxPlayers: null,
  playTimeMinutes: null,
  sections: [],
})

function addSection() {
  form.sections.push({ title: '', body: '', sortOrder: form.sections.length + 1, items: [] })
}

function removeSection(index: number) {
  form.sections.splice(index, 1)
}

function addItem(section: SectionWrite) {
  section.items.push({ title: '', body: '', sortOrder: section.items.length + 1 })
}

function removeItem(section: SectionWrite, index: number) {
  section.items.splice(index, 1)
}

async function loadForEdit(slug: string) {
  loading.value = true
  try {
    const game = await gamesApi.getBySlug(slug)
    isEdit.value = true
    gameId.value = game.id
    form.name = game.name
    form.description = game.description ?? ''
    form.imageUrl = game.imageUrl ?? ''
    form.minPlayers = game.minPlayers
    form.maxPlayers = game.maxPlayers
    form.playTimeMinutes = game.playTimeMinutes
    form.sections = game.sections.map((s) => ({
      title: s.title,
      body: s.body ?? '',
      sortOrder: s.sortOrder,
      items: s.items.map((i) => ({ title: i.title, body: i.body, sortOrder: i.sortOrder })),
    }))
  } catch {
    error.value = 'Kon spel niet laden.'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = null
  // Re-number sort orders from the current visual order.
  form.sections.forEach((s, si) => {
    s.sortOrder = si + 1
    s.items.forEach((i, ii) => (i.sortOrder = ii + 1))
  })
  const payload: GameWrite = {
    ...form,
    description: form.description || null,
    imageUrl: form.imageUrl || null,
  }
  try {
    const result = isEdit.value && gameId.value
      ? await gamesApi.update(gameId.value, payload)
      : await gamesApi.create(payload)
    router.push({ name: 'game-detail', params: { slug: result.slug } })
  } catch (e: any) {
    error.value = e?.response?.data?.errors
      ? Object.values(e.response.data.errors).flat().join(' ')
      : 'Opslaan mislukt.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (props.slug) loadForEdit(props.slug)
  else addSection()
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="mb-6 text-2xl font-bold">{{ isEdit ? 'Spel bewerken' : 'Nieuw spel' }}</h1>

    <p v-if="loading" class="text-gray-400">Laden…</p>

    <form v-else class="space-y-6" @submit.prevent="save">
      <div class="card space-y-4">
        <div>
          <label class="label">Naam</label>
          <input v-model="form.name" class="input" required placeholder="1000 Bommen en Granaten" />
        </div>
        <div>
          <label class="label">Omschrijving</label>
          <textarea v-model="form.description" class="input" rows="2" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="label">Min. spelers</label>
            <input v-model.number="form.minPlayers" type="number" min="1" class="input" />
          </div>
          <div>
            <label class="label">Max. spelers</label>
            <input v-model.number="form.maxPlayers" type="number" min="1" class="input" />
          </div>
          <div>
            <label class="label">Speelduur (min)</label>
            <input v-model.number="form.playTimeMinutes" type="number" min="1" class="input" />
          </div>
        </div>
      </div>

      <!-- Sections -->
      <div v-for="(section, si) in form.sections" :key="si" class="card space-y-4">
        <div class="flex items-center justify-between gap-3">
          <input v-model="section.title" class="input" placeholder="Sectietitel (bijv. Kaarten)" />
          <button type="button" class="btn-ghost text-red-400" @click="removeSection(si)">✕</button>
        </div>
        <div>
          <label class="label">Vrije tekst (markdown, optioneel)</label>
          <textarea v-model="section.body" class="input" rows="2" placeholder="**Doe dit** en krijg dat…" />
        </div>

        <div class="space-y-3">
          <div
            v-for="(item, ii) in section.items"
            :key="ii"
            class="rounded-lg border border-border p-3"
          >
            <div class="flex items-center gap-2">
              <input v-model="item.title" class="input" placeholder="Titel (bijv. Piraat)" />
              <button type="button" class="btn-ghost text-red-400" @click="removeItem(section, ii)">
                ✕
              </button>
            </div>
            <textarea
              v-model="item.body"
              class="input mt-2"
              rows="2"
              placeholder="Doe: … Krijg: …"
            />
          </div>
          <button type="button" class="btn-ghost w-full" @click="addItem(section)">
            + Item toevoegen
          </button>
        </div>
      </div>

      <button type="button" class="btn-ghost w-full" @click="addSection">+ Sectie toevoegen</button>

      <p v-if="error" class="text-red-400">{{ error }}</p>

      <div class="flex gap-3">
        <button type="submit" class="btn-primary" :disabled="saving">
          {{ saving ? 'Opslaan…' : 'Opslaan' }}
        </button>
        <RouterLink class="btn-ghost" :to="{ name: 'home' }">Annuleren</RouterLink>
      </div>
    </form>
  </div>
</template>
