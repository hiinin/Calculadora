<script setup lang="ts">
import type { BinaryOperation } from '../api/calculatorApi'
import CalcButton from './CalcButton.vue'

/**
 * Teclado "burro" (presentational component): só desenha botões e emite eventos.
 * Quem decide o que fazer é o componente pai (padrão "props down, events up").
 */
defineProps<{
  clearLabel: 'AC' | 'C'
  activeOperation: BinaryOperation | null
  busy?: boolean
}>()

const emit = defineEmits<{
  digit: [digit: string]
  decimal: []
  operation: [operation: BinaryOperation]
  equals: []
  clear: []
  toggleSign: []
  percent: []
}>()

const digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3']

const operators: { operation: BinaryOperation; symbol: string; label: string }[] = [
  { operation: 'divide', symbol: '÷', label: 'Dividir' },
  { operation: 'multiply', symbol: '×', label: 'Multiplicar' },
  { operation: 'subtract', symbol: '−', label: 'Subtrair' },
  { operation: 'add', symbol: '+', label: 'Somar' },
]
</script>

<template>
  <div class="grid grid-cols-4 gap-[3.2%]" role="group" aria-label="Teclado">
    <CalcButton variant="function" :aria-label="clearLabel === 'AC' ? 'Limpar tudo' : 'Limpar entrada'" @click="emit('clear')">
      {{ clearLabel }}
    </CalcButton>
    <CalcButton variant="function" aria-label="Inverter sinal" @click="emit('toggleSign')">±</CalcButton>
    <CalcButton variant="function" aria-label="Porcentagem" :disabled="busy" @click="emit('percent')">%</CalcButton>
    <CalcButton
      variant="operator"
      :aria-label="operators[0].label"
      :active="activeOperation === operators[0].operation"
      :disabled="busy"
      @click="emit('operation', operators[0].operation)"
    >
      {{ operators[0].symbol }}
    </CalcButton>

    <!-- Linhas 7-8-9 / 4-5-6 / 1-2-3 intercaladas com os operadores × − + -->
    <template v-for="(row, index) in 3" :key="row">
      <CalcButton v-for="digit in digits.slice(index * 3, index * 3 + 3)" :key="digit" @click="emit('digit', digit)">
        {{ digit }}
      </CalcButton>
      <CalcButton
        variant="operator"
        :aria-label="operators[index + 1].label"
        :active="activeOperation === operators[index + 1].operation"
        :disabled="busy"
        @click="emit('operation', operators[index + 1].operation)"
      >
        {{ operators[index + 1].symbol }}
      </CalcButton>
    </template>

    <CalcButton wide aria-label="Zero" @click="emit('digit', '0')">0</CalcButton>
    <CalcButton aria-label="Vírgula decimal" @click="emit('decimal')">,</CalcButton>
    <CalcButton variant="operator" aria-label="Igual" :disabled="busy" @click="emit('equals')">=</CalcButton>
  </div>
</template>
