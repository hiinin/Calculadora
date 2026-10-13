<script setup lang="ts">
import { computed } from 'vue'
import { formatDisplay } from '../utils/formatDisplay'

const props = defineProps<{
  /** String crua do display (ex.: "-1234.5"). A formatação é feita aqui. */
  value: string
  /** Mensagem de erro da API (exibida discretamente abaixo do número). */
  error?: string | null
}>()

const text = computed(() => (props.error ? props.value : formatDisplay(props.value)))

/**
 * Reduz a fonte conforme o tamanho do número, para nunca estourar a tela
 * (o iOS faz o mesmo). Valores em `rem` escalam com a preferência do usuário.
 */
const sizeClass = computed(() => {
  const length = text.value.length
  if (length <= 6) return 'text-[clamp(4rem,22vw,5.5rem)]'
  if (length <= 9) return 'text-[clamp(3.25rem,17vw,4.5rem)]'
  if (length <= 12) return 'text-[clamp(2.5rem,13vw,3.5rem)]'
  return 'text-[clamp(1.75rem,9vw,2.5rem)]'
})
</script>

<template>
  <section class="flex flex-col items-end justify-end px-2 pb-2" aria-label="Visor">
    <p v-if="error" class="mb-1 text-sm text-red-400" role="alert">{{ error }}</p>
    <output
      class="block max-w-full overflow-hidden whitespace-nowrap font-light leading-none tracking-tight tabular-nums transition-[font-size] duration-100"
      :class="sizeClass"
      aria-live="polite"
      data-testid="display"
    >
      {{ text }}
    </output>
  </section>
</template>
