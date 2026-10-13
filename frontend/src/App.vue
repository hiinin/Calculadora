<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { createCalculatorApi, type BinaryOperation } from './api/calculatorApi'
import CalcDisplay from './components/CalcDisplay.vue'
import CalcKeypad from './components/CalcKeypad.vue'
import { useCalculator } from './composables/useCalculator'

// VITE_API_URL é opcional: vazio => usa o proxy do Vite em dev ("/api" -> PHP).
const api = createCalculatorApi(import.meta.env.VITE_API_URL ?? '')
const calc = useCalculator(api)

const operatorKeys: Record<string, BinaryOperation> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  x: 'multiply',
  '/': 'divide',
}

/** Atalhos de teclado: dígitos, + - * /, Enter ou =, Backspace, Esc, vírgula/ponto, %. */
function onKeydown(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return

  const { key } = event
  if (/^[0-9]$/.test(key)) calc.inputDigit(key)
  else if (key in operatorKeys) calc.chooseOperation(operatorKeys[key])
  else if (key === ',' || key === '.') calc.inputDecimal()
  else if (key === 'Enter' || key === '=') calc.equals()
  else if (key === 'Backspace') calc.backspace()
  else if (key === 'Escape' || key.toLowerCase() === 'c') calc.clear()
  else if (key === '%') calc.percent()
  else return

  // Evita que Enter "clique" no botão focado e que "/" abra a busca rápida do Firefox.
  event.preventDefault()
}

// Registrar/remover listeners global no ciclo de vida evita vazamento de memória.
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <main class="flex min-h-full items-center justify-center bg-[radial-gradient(ellipse_at_top,#1c1c1e_0%,#000_70%)] p-4">
    <div class="flex h-[min(100dvh-2rem,50rem)] w-full max-w-sm flex-col justify-end gap-3 rounded-[2.5rem] bg-black p-5 sm:ring-1 sm:ring-white/10 sm:shadow-[0_30px_80px_-20px_rgba(255,159,10,0.18)]">
      <h1 class="sr-only">Calculadora</h1>
      <CalcDisplay class="min-h-0 flex-1" :value="calc.display.value" :error="calc.errorMessage.value" />
      <CalcKeypad
        :clear-label="calc.clearLabel.value"
        :active-operation="calc.activeOperation.value"
        :busy="calc.busy.value"
        @digit="calc.inputDigit"
        @decimal="calc.inputDecimal"
        @operation="calc.chooseOperation"
        @equals="calc.equals"
        @clear="calc.clear"
        @toggle-sign="calc.toggleSign"
        @percent="calc.percent"
      />
    </div>
  </main>
</template>
