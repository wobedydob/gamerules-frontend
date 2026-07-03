<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

async function submit() {
  busy.value = true
  error.value = null
  try {
    await auth.register(email.value, password.value, displayName.value)
    router.push('/')
  } catch (e: any) {
    error.value = e?.response?.data?.errors
      ? (e.response.data.errors as string[]).join(' ')
      : e?.response?.data?.message ?? 'Registreren mislukt.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm">
    <h1 class="mb-6 text-3xl font-extrabold text-ink">Registreren</h1>
    <form class="card space-y-4 p-6" @submit.prevent="submit">
      <div>
        <label class="label">Naam</label>
        <input v-model="displayName" class="input" required autocomplete="name" />
      </div>
      <div>
        <label class="label">E-mail</label>
        <input v-model="email" type="email" class="input" required autocomplete="email" />
      </div>
      <div>
        <label class="label">Wachtwoord</label>
        <input v-model="password" type="password" class="input" required minlength="8" autocomplete="new-password" />
      </div>
      <p v-if="error" class="text-sm text-accent">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="busy">
        {{ busy ? 'Bezig…' : 'Account aanmaken' }}
      </button>
      <p class="text-center text-sm text-muted">
        Al een account?
        <RouterLink :to="{ name: 'login' }" class="font-semibold text-accent">Inloggen</RouterLink>
      </p>
    </form>
  </div>
</template>
