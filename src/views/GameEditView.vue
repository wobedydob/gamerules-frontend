<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { GripVertical, Layers, ListChecks, Plus, Trash2 } from 'lucide-vue-next'
import { gamesApi } from '../services/games'
import type { GameWrite, SectionType } from '../services/types'
import MarkdownText from '../components/MarkdownText.vue'
import CoverImage from '../components/CoverImage.vue'

const props = defineProps<{ slug?: string }>()
const router = useRouter()

// ---- Local editor model (uid = stable key for selection; stripped before save) ----
interface EditItem {
  uid: number
  title: string
  body: string
}
interface EditSection {
  uid: number
  title: string
  type: SectionType
  body: string
  items: EditItem[]
}

let uidSeq = 0
const nextUid = () => ++uidSeq

const game = reactive({
  name: '',
  description: '',
  imageUrl: '',
  minPlayers: null as number | null,
  maxPlayers: null as number | null,
  playTimeMinutes: null as number | null,
  quickSetup: '',
  playerRules: '',
})
const sections = reactive<EditSection[]>([])

// ---- Selection (reference-based, survives reorder) ----
type Selected =
  | { kind: 'game' }
  | { kind: 'section'; s: EditSection }
  | { kind: 'item'; s: EditSection; i: EditItem }
const selected = ref<Selected>({ kind: 'game' })

function isSectionSelected(s: EditSection) {
  return selected.value.kind === 'section' && selected.value.s === s
}
function isItemSelected(i: EditItem) {
  return selected.value.kind === 'item' && selected.value.i === i
}

async function select(sel: Selected) {
  selected.value = sel
  // On mobile the form sits below the tree — bring it into view.
  if (window.innerWidth < 900) {
    await nextTick()
    document.getElementById('editor-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ---- State ----
const isEdit = ref(false)
const gameId = ref<number | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

// ---- Serialize to the API payload (drops uid, renumbers sort) ----
function serialize(): GameWrite {
  return {
    name: game.name,
    description: game.description || null,
    imageUrl: game.imageUrl || null,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    playTimeMinutes: game.playTimeMinutes,
    quickSetup: game.quickSetup || null,
    playerRules: game.playerRules || null,
    sections: sections.map((s, si) => ({
      title: s.title,
      type: s.type,
      body: s.body || null,
      sortOrder: si + 1,
      items: s.items.map((i, ii) => ({ title: i.title, body: i.body, sortOrder: ii + 1 })),
    })),
  }
}

let baseline = ''
const dirty = computed(() => JSON.stringify(serialize()) !== baseline)
function snapshot() {
  baseline = JSON.stringify(serialize())
}

const slugPreview = computed(() =>
  game.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, ''),
)

// ---- Structure mutations ----
function addSection() {
  const s: EditSection = { uid: nextUid(), title: '', type: 'list', body: '', items: [] }
  sections.push(s)
  select({ kind: 'section', s })
}
function removeSection(s: EditSection) {
  const idx = sections.indexOf(s)
  if (idx >= 0) sections.splice(idx, 1)
  selected.value = { kind: 'game' }
}
function addItem(s: EditSection) {
  const i: EditItem = { uid: nextUid(), title: '', body: '' }
  s.items.push(i)
  select({ kind: 'item', s, i })
}
function removeItem(s: EditSection, i: EditItem) {
  const idx = s.items.indexOf(i)
  if (idx >= 0) s.items.splice(idx, 1)
  selected.value = { kind: 'section', s }
}

// ---- Drag reorder ----
const dragSection = ref<number | null>(null)
const dragItem = ref<{ s: number; i: number } | null>(null)
function moveInArray<T>(arr: T[], from: number, to: number) {
  const [el] = arr.splice(from, 1)
  arr.splice(to, 0, el)
}
function dropSection(to: number) {
  if (dragSection.value === null || dragSection.value === to) return
  moveInArray(sections, dragSection.value, to)
  dragSection.value = null
}
function dropItem(sectionIndex: number, to: number) {
  if (!dragItem.value || dragItem.value.s !== sectionIndex) return
  moveInArray(sections[sectionIndex].items, dragItem.value.i, to)
  dragItem.value = null
}

// ---- Load / save ----
async function loadForEdit(slug: string) {
  loading.value = true
  try {
    const g = await gamesApi.getBySlug(slug)
    isEdit.value = true
    gameId.value = g.id
    game.name = g.name
    game.description = g.description ?? ''
    game.imageUrl = g.imageUrl ?? ''
    game.minPlayers = g.minPlayers
    game.maxPlayers = g.maxPlayers
    game.playTimeMinutes = g.playTimeMinutes
    game.quickSetup = g.quickSetup ?? ''
    game.playerRules = g.playerRules ?? ''
    sections.splice(
      0,
      sections.length,
      ...g.sections.map((s) => ({
        uid: nextUid(),
        title: s.title,
        type: s.type,
        body: s.body ?? '',
        items: s.items.map((i) => ({ uid: nextUid(), title: i.title, body: i.body })),
      })),
    )
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
  try {
    const payload = serialize()
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
    selected.value = { kind: 'game' }
    snapshot()
  }
})
</script>

<template>
  <div class="pb-24">
    <h1 class="mb-6 text-3xl font-extrabold text-ink">
      {{ isEdit ? 'Spel bewerken' : 'Nieuw spel' }}
    </h1>

    <p v-if="loading" class="text-muted">Laden…</p>

    <div v-else class="gap-6 min-[900px]:grid min-[900px]:grid-cols-[260px_1fr]">
      <!-- Structure tree -->
      <aside class="mb-5 min-[900px]:mb-0 min-[900px]:sticky min-[900px]:top-20 min-[900px]:h-fit">
        <button
          type="button"
          class="mb-1 w-full rounded-item px-3 py-2 text-left text-sm font-bold transition-colors"
          :class="selected.kind === 'game' ? 'bg-tint text-accent' : 'text-ink hover:bg-surface-alt'"
          @click="select({ kind: 'game' })"
        >
          {{ game.name || 'Naamloos spel' }}
        </button>

        <div
          v-for="(s, si) in sections"
          :key="s.uid"
          class="mb-1"
          :class="{ 'opacity-50': dragSection === si }"
          @dragover.prevent
          @drop="dropSection(si)"
        >
          <div
            class="flex items-center gap-1 rounded-item pr-1 transition-colors"
            :class="isSectionSelected(s) ? 'bg-tint' : 'hover:bg-surface-alt'"
          >
            <span
              class="cursor-grab pl-1.5 text-faint active:cursor-grabbing"
              draggable="true"
              @dragstart="dragSection = si"
              @dragend="dragSection = null"
            >
              <GripVertical :size="15" />
            </span>
            <button
              type="button"
              class="flex flex-1 items-center gap-1.5 py-1.5 text-left text-sm font-semibold"
              :class="isSectionSelected(s) ? 'text-accent' : 'text-ink'"
              @click="select({ kind: 'section', s })"
            >
              <component :is="s.type === 'cards' ? Layers : ListChecks" :size="14" class="shrink-0 text-faint" />
              <span class="truncate">{{ s.title || 'Naamloze sectie' }}</span>
            </button>
          </div>

          <!-- Items -->
          <div class="ml-4 border-l border-hair pl-2">
            <div
              v-for="(i, ii) in s.items"
              :key="i.uid"
              class="flex items-center gap-1 rounded-item pr-1 transition-colors"
              :class="[
                isItemSelected(i) ? 'bg-tint' : 'hover:bg-surface-alt',
                { 'opacity-50': dragItem?.s === si && dragItem?.i === ii },
              ]"
              @dragover.prevent
              @drop="dropItem(si, ii)"
            >
              <span
                class="cursor-grab pl-1 text-faint active:cursor-grabbing"
                draggable="true"
                @dragstart="dragItem = { s: si, i: ii }"
                @dragend="dragItem = null"
              >
                <GripVertical :size="13" />
              </span>
              <button
                type="button"
                class="flex-1 truncate py-1 text-left text-sm"
                :class="isItemSelected(i) ? 'text-accent' : 'text-muted'"
                @click="select({ kind: 'item', s, i })"
              >
                {{ i.title || 'Naamloos item' }}
              </button>
            </div>
            <button
              type="button"
              class="flex items-center gap-1 py-1 text-xs font-semibold text-muted hover:text-accent"
              @click="addItem(s)"
            >
              <Plus :size="13" /> Item
            </button>
          </div>
        </div>

        <button
          type="button"
          class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-item border border-dashed border-chunky py-2 text-sm font-semibold text-muted hover:border-accent hover:text-accent"
          @click="addSection"
        >
          <Plus :size="15" /> Sectie toevoegen
        </button>
      </aside>

      <!-- Form panel -->
      <section id="editor-form" class="card min-w-0 p-5">
        <!-- Game fields -->
        <div v-if="selected.kind === 'game'" class="space-y-4">
          <h2 class="text-lg font-extrabold text-ink">Spelgegevens</h2>
          <div>
            <label class="label">Naam</label>
            <input v-model="game.name" class="input" placeholder="1000 Bommen en Granaten" />
            <p v-if="slugPreview" class="mt-1 text-xs text-faint">
              URL wordt: <span class="text-muted">/spel/{{ slugPreview }}</span>
            </p>
          </div>
          <div>
            <label class="label">Korte omschrijving</label>
            <textarea v-model="game.description" class="input" rows="2" placeholder="Eén zin die het spel samenvat." />
          </div>
          <div>
            <label class="label">Omslagafbeelding (URL)</label>
            <input v-model="game.imageUrl" class="input" placeholder="https://…" />
            <div v-if="game.imageUrl" class="mt-2 aspect-video max-w-xs overflow-hidden rounded-item border border-card-line">
              <CoverImage :src="game.imageUrl" alt="Voorbeeld" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="label">Min. spelers</label>
              <input v-model.number="game.minPlayers" type="number" min="1" class="input" />
            </div>
            <div>
              <label class="label">Max. spelers</label>
              <input v-model.number="game.maxPlayers" type="number" min="1" class="input" />
            </div>
            <div>
              <label class="label">Duur (min)</label>
              <input v-model.number="game.playTimeMinutes" type="number" min="1" class="input" />
            </div>
          </div>
          <div>
            <label class="label">Zo leg je klaar (markdown, optioneel)</label>
            <textarea v-model="game.quickSetup" class="input" rows="3" placeholder="Kort: hoe leg je het spel klaar?" />
            <MarkdownText v-if="game.quickSetup" :text="game.quickSetup" class="mt-2 rounded-item bg-surface-alt p-2.5" />
          </div>
          <div>
            <label class="label">Per aantal spelers (markdown, optioneel)</label>
            <textarea v-model="game.playerRules" class="input" rows="4" placeholder="Bijv. **2 spelers:** … / **3 spelers:** …" />
            <MarkdownText v-if="game.playerRules" :text="game.playerRules" class="mt-2 rounded-item bg-surface-alt p-2.5" />
          </div>
        </div>

        <!-- Section fields -->
        <div v-else-if="selected.kind === 'section'" class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-extrabold text-ink">Sectie</h2>
            <button type="button" class="btn-icon" title="Sectie verwijderen" @click="removeSection(selected.s)">
              <Trash2 :size="16" />
            </button>
          </div>
          <div>
            <label class="label">Titel</label>
            <input v-model="selected.s.title" class="input" placeholder="Bijv. Kaarten" />
          </div>
          <div>
            <label class="label">Weergave</label>
            <div class="flex gap-2">
              <button
                type="button"
                class="btn flex-1 border"
                :class="selected.s.type === 'list' ? 'border-accent bg-tint text-accent' : 'border-card-line bg-card text-muted'"
                @click="selected.s.type = 'list'"
              >
                <ListChecks :size="16" /> Lijst
              </button>
              <button
                type="button"
                class="btn flex-1 border"
                :class="selected.s.type === 'cards' ? 'border-cat-line bg-cat text-cat-text' : 'border-card-line bg-card text-muted'"
                @click="selected.s.type = 'cards'"
              >
                <Layers :size="16" /> Kaarten
              </button>
            </div>
          </div>
          <div>
            <label class="label">Vrije tekst (markdown, optioneel)</label>
            <textarea v-model="selected.s.body" class="input" rows="3" placeholder="**Doe dit** en krijg dat…" />
            <MarkdownText v-if="selected.s.body" :text="selected.s.body" class="mt-2 rounded-item bg-surface-alt p-2.5" />
          </div>
          <button type="button" class="btn-ghost w-full" @click="addItem(selected.s)">
            <Plus :size="15" /> Item toevoegen
          </button>
        </div>

        <!-- Item fields -->
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-extrabold text-ink">Item</h2>
            <button type="button" class="btn-icon" title="Item verwijderen" @click="removeItem(selected.s, selected.i)">
              <Trash2 :size="16" />
            </button>
          </div>
          <div>
            <label class="label">Titel</label>
            <input v-model="selected.i.title" class="input" placeholder="Bijv. Piraat" />
          </div>
          <div>
            <label class="label">Regel (markdown)</label>
            <textarea v-model="selected.i.body" class="input" rows="3" placeholder="Doe: … Krijg: …" />
            <MarkdownText v-if="selected.i.body" :text="selected.i.body" class="mt-2 rounded-item bg-surface-alt p-2.5" />
          </div>
        </div>
      </section>
    </div>

    <p v-if="error" class="mt-4 text-accent">{{ error }}</p>

    <!-- Sticky save bar -->
    <div v-if="!loading" class="fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-surface/90 backdrop-blur">
      <div class="mx-auto flex max-w-content items-center justify-between gap-3 px-5 py-3">
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
