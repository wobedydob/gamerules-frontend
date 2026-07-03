<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{ text: string | null | undefined }>()

// marked.parse is synchronous by default (no async extensions in use).
const html = computed(() => (props.text ? (marked.parse(props.text) as string) : ''))
</script>

<template>
  <div class="prose-rules text-sm text-muted" v-html="html"></div>
</template>
