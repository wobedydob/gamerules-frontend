<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const busy = ref(false)

async function submit() {
  busy.value = true
  error.value = null
  try {
    await auth.login(email.value, password.value)
    router.push((route.query.redirect as string) || '/')
  } catch {
    error.value = 'Ongeldige e-mail of wachtwoord.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-sm">
    <h1 class="mb-6 text-3xl font-extrabold text-ink">Inloggen</h1>
    <form class="card space-y-4 p-6" @submit.prevent="submit">
      <div>
        <label class="label">E-mail</label>
        <input v-model="email" type="email" class="input" required autocomplete="email" />
      </div>
      <div>
        <label class="label">Wachtwoord</label>
        <input v-model="password" type="password" class="input" required autocomplete="current-password" />
      </div>
      <p v-if="error" class="text-sm text-accent">{{ error }}</p>
      <button type="submit" class="btn-primary w-full" :disabled="busy">
        {{ busy ? 'Bezig…' : 'Inloggen' }}
      </button>
      <p class="text-center text-sm text-muted">
        Nog geen account?
        <RouterLink :to="{ name: 'register' }" class="font-semibold text-accent">Registreren</RouterLink>
      </p>
    </form>
  </div>
</template>
