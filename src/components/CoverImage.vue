<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ src: string | null; alt: string }>()
const failed = ref(false)

watch(
  () => props.src,
  () => (failed.value = false),
)
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    class="h-full w-full object-cover"
    loading="lazy"
    @error="failed = true"
  />
  <div v-else class="cover-placeholder h-full w-full" aria-hidden="true"></div>
</template>
