<script setup lang="ts">
import { computed } from 'vue'

/**
 * Botão base da calculadora. As cores vêm das variáveis do @theme (style.css).
 * Variantes espelham o iOS: dígitos (cinza escuro), funções (cinza claro), operadores (laranja).
 */
type Variant = 'digit' | 'function' | 'operator'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    /** Operador selecionado: inverte as cores (fundo branco, texto laranja). */
    active?: boolean
    /** Ocupa 2 colunas (botão "0"). */
    wide?: boolean
    disabled?: boolean
  }>(),
  { variant: 'digit', active: false, wide: false, disabled: false },
)

// Classes completas escritas por extenso: o Tailwind só gera CSS para strings que encontra no código,
// então NÃO monte nomes dinamicamente (ex.: `bg-${cor}`).
const variantClasses: Record<Variant, string> = {
  digit: 'bg-key-digit text-white active:bg-key-digit-active',
  function: 'bg-key-function text-black active:bg-key-function-active',
  operator: 'bg-key-operator text-white active:bg-key-operator-active',
}

const classes = computed(() => [
  variantClasses[props.variant],
  props.wide ? 'col-span-2 justify-start pl-[8.5%]' : 'aspect-square justify-center',
  props.active && 'bg-white! text-key-operator!',
])
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="classes"
    class="flex cursor-pointer select-none items-center rounded-full text-[clamp(1.75rem,8vw,2.25rem)] font-normal leading-none outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white/70 active:duration-0 disabled:cursor-wait"
  >
    <slot />
  </button>
</template>
