<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { GripVertical, Plus, Trash2 } from 'lucide-vue-next'
import { gamesApi } from '../services/games'
import type { GameWrite, SectionWrite } from '../services/types'
import MarkdownText from '../components/MarkdownText.vue'
import CoverImage from '../components/CoverImage.vue'

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

// ---- Dirty tracking ----
let baseline = ''
const dirty = computed(() => JSON.stringify(form) !== baseline)
function snapshot() {
  baseline = JSON.stringify(form)
}

// ---- Client-side slug preview (server generates the real one) ----
const slugPreview = computed(() =>
  form.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, ''),
)

// ---- Structure editing ----
function addSection() {
  form.sections.push({ title: '', body: '', sortOrder: form.sections.length + 1, items: [] })
}
function removeSection(i: number) {
  form.sections.splice(i, 1)
}
function addItem(section: SectionWrite) {
  section.items.push({ title: '', body: '', sortOrder: section.items.length + 1 })
}
function removeItem(section: SectionWrite, i: number) {
  section.items.splice(i, 1)
}

// ---- Drag reorder (handle-driven, native HTML5 DnD) ----
const dragSection = ref<number | null>(null)
const dragItem = ref<{ s: number; i: number } | null>(null)

function moveInArray<T>(arr: T[], from: number, to: number) {
  const [el] = arr.splice(from, 1)
  arr.splice(to, 0, el)
}
function dropSection(to: number) {
  if (dragSection.value === null || dragSection.value === to) return
  moveInArray(form.sections, dragSection.value, to)
  dragSection.value = null
}
function dropItem(sectionIndex: number, to: number) {
  if (!dragItem.value || dragItem.value.s !== sectionIndex) return
  moveInArray(form.sections[sectionIndex].items, dragItem.value.i, to)
  dragItem.value = null
}

// ---- Load / save ----
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
    snapshot()
  }
}

async function save() {
  saving.value = true
  error.value = null
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
    const result =
      isEdit.value && gameId.value
        ? await gamesApi.update(gameId.value, payload)
        : await gamesApi.create(payload)
    snapshot()
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
  else {
    addSection()
    snapshot()
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl pb-24">
    <h1 class="mb-6 text-3xl font-extrabold text-ink">
      {{ isEdit ? 'Spel bewerken' : 'Nieuw spel' }}
    </h1>

    <p v-if="loading" class="text-muted">Laden…</p>

    <form v-else class="space-y-6" @submit.prevent="save">
      <!-- Game fields -->
      <div class="card space-y-4 p-5">
        <div>
          <label class="label">Naam</label>
          <input v-model="form.name" class="input" required placeholder="1000 Bommen en Granaten" />
          <p v-if="slugPreview" class="mt-1 text-xs text-faint">
            URL wordt: <span class="text-muted">/spel/{{ slugPreview }}</span>
          </p>
        </div>
        <div>
          <label class="label">Korte omschrijving</label>
          <textarea v-model="form.description" class="input" rows="2" placeholder="Eén zin die het spel samenvat." />
        </div>
        <div>
          <label class="label">Omslagafbeelding (URL)</label>
          <input v-model="form.imageUrl" class="input" placeholder="https://…" />
          <div v-if="form.imageUrl" class="mt-2 aspect-video max-w-xs overflow-hidden rounded-item border border-card-line">
            <CoverImage :src="form.imageUrl" alt="Voorbeeld" />
          </div>
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
            <label class="label">Duur (min)</label>
            <input v-model.number="form.playTimeMinutes" type="number" min="1" class="input" />
          </div>
        </div>
      </div>

      <!-- Sections -->
      <div
        v-for="(section, si) in form.sections"
        :key="si"
        class="card space-y-4 p-5"
        :class="{ 'opacity-50': dragSection === si }"
        @dragover.prevent
        @drop="dropSection(si)"
      >
        <div class="flex items-center gap-2">
          <span
            class="cursor-grab text-faint hover:text-muted active:cursor-grabbing"
            draggable="true"
            title="Sleep om te ordenen"
            @dragstart="dragSection = si"
            @dragend="dragSection = null"
          >
            <GripVertical :size="18" />
          </span>
          <input v-model="section.title" class="input" placeholder="Sectietitel (bijv. Kaarten)" />
          <button type="button" class="btn-icon" title="Sectie verwijderen" @click="removeSection(si)">
            <Trash2 :size="16" />
          </button>
        </div>

        <div>
          <label class="label">Vrije tekst (markdown, optioneel)</label>
          <textarea v-model="section.body" class="input" rows="2" placeholder="**Doe dit** en krijg dat…" />
          <MarkdownText v-if="section.body" :text="section.body" class="mt-2 rounded-item bg-surface-alt p-2.5" />
        </div>

        <!-- Items -->
        <div class="space-y-3">
          <div
            v-for="(item, ii) in section.items"
            :key="ii"
            class="rounded-item border border-card-line p-3"
            :class="{ 'opacity-50': dragItem?.s === si && dragItem?.i === ii }"
            @dragover.prevent
            @drop="dropItem(si, ii)"
          >
            <div class="flex items-center gap-2">
              <span
                class="cursor-grab text-faint hover:text-muted active:cursor-grabbing"
                draggable="true"
                title="Sleep om te ordenen"
                @dragstart="dragItem = { s: si, i: ii }"
                @dragend="dragItem = null"
              >
                <GripVertical :size="16" />
              </span>
              <input v-model="item.title" class="input" placeholder="Titel (bijv. Piraat)" />
              <button type="button" class="btn-icon" title="Item verwijderen" @click="removeItem(section, ii)">
                <Trash2 :size="15" />
              </button>
            </div>
            <textarea v-model="item.body" class="input mt-2" rows="2" placeholder="Doe: … Krijg: …" />
            <MarkdownText v-if="item.body" :text="item.body" class="mt-2 rounded-item bg-surface-alt p-2.5" />
          </div>
          <button type="button" class="btn-ghost w-full" @click="addItem(section)">
            <Plus :size="15" /> Item toevoegen
          </button>
        </div>
      </div>

      <button type="button" class="btn-ghost w-full" @click="addSection">
        <Plus :size="16" /> Sectie toevoegen
      </button>

      <p v-if="error" class="text-accent">{{ error }}</p>
    </form>

    <!-- Sticky save bar -->
    <div
      v-if="!loading"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-surface/90 backdrop-blur"
    >
      <div class="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
        <span class="text-sm text-faint">
          {{ dirty ? 'Niet-opgeslagen wijzigingen' : 'Alles opgeslagen' }}
        </span>
        <div class="flex gap-2">
          <RouterLink class="btn-ghost" :to="{ name: 'home' }">Annuleren</RouterLink>
          <button class="btn-primary" :disabled="saving" @click="save">
            {{ saving ? 'Opslaan…' : 'Opslaan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
