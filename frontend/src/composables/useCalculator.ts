import { computed, ref } from 'vue'
import type { BinaryOperation, CalculatorApi } from '../api/calculatorApi'
import { countDigits } from '../utils/formatDisplay'

/** Limite de dígitos digitáveis, igual ao iPhone. */
const MAX_DIGITS = 9

interface RepeatedOperation {
  operation: BinaryOperation
  operand: string
}

/**
 * Composable = função que encapsula estado reativo + lógica (a "Composition API" do Vue).
 *
 * Aqui mora a MÁQUINA DE ESTADOS da calculadora (como o app do iOS se comporta).
 * Os cálculos em si ficam no back-end; recebemos a `api` por parâmetro
 * (injeção de dependência) para poder testar com uma API falsa.
 *
 * Estado:
 *  - display:          o que o usuário vê (string crua, ex.: "-12.5")
 *  - accumulator:      1º operando, guardado ao escolher um operador
 *  - pendingOperation: operador aguardando o 2º operando
 *  - awaitingOperand:  true => o próximo dígito começa um número novo
 *  - repeat:           última operação, para "=" repetido (2+3=== -> 5, 8, 11)
 */
export function useCalculator(api: CalculatorApi) {
  const display = ref('0')
  const accumulator = ref<string | null>(null)
  const pendingOperation = ref<BinaryOperation | null>(null)
  const awaitingOperand = ref(false)
  const repeat = ref<RepeatedOperation | null>(null)
  const errorMessage = ref<string | null>(null)
  const busy = ref(false)

  /** Destaca o operador ativo na UI (igual ao iOS: só enquanto aguarda o 2º número). */
  const activeOperation = computed(() => (awaitingOperand.value ? pendingOperation.value : null))
  /** O botão alterna entre "AC" (limpa tudo) e "C" (limpa só a entrada atual). */
  const clearLabel = computed<'AC' | 'C'>(() =>
    display.value !== '0' && !awaitingOperand.value ? 'C' : 'AC',
  )
  const hasError = computed(() => errorMessage.value !== null)

  function resetAll(): void {
    display.value = '0'
    accumulator.value = null
    pendingOperation.value = null
    awaitingOperand.value = false
    repeat.value = null
    errorMessage.value = null
  }

  /** Qualquer tecla após um erro recomeça do zero. */
  function recoverFromError(): void {
    if (hasError.value) resetAll()
  }

  /**
   * Executa uma chamada à API com tratamento de erro centralizado e trava anti-duplo-clique.
   * Devolve `null` em caso de falha (o erro vai para o display).
   */
  async function compute(...args: Parameters<CalculatorApi['calculate']>): Promise<string | null> {
    busy.value = true
    try {
      return await api.calculate(...args)
    } catch (error) {
      resetAll()
      display.value = 'Erro'
      errorMessage.value = error instanceof Error ? error.message : 'Erro inesperado.'
      return null
    } finally {
      busy.value = false
    }
  }

  function inputDigit(digit: string): void {
    if (busy.value) return
    recoverFromError()

    if (awaitingOperand.value) {
      // Digitar após "=" inicia um cálculo novo; após um operador, continua o atual.
      if (pendingOperation.value === null) repeat.value = null
      display.value = digit
      awaitingOperand.value = false
      return
    }

    if (countDigits(display.value) >= MAX_DIGITS) return
    display.value = display.value === '0' ? digit : display.value + digit
  }

  function inputDecimal(): void {
    if (busy.value) return
    recoverFromError()

    if (awaitingOperand.value) {
      if (pendingOperation.value === null) repeat.value = null
      display.value = '0.'
      awaitingOperand.value = false
      return
    }

    if (!display.value.includes('.')) display.value += '.'
  }

  async function chooseOperation(operation: BinaryOperation): Promise<void> {
    if (busy.value) return
    recoverFromError()

    // Encadeamento: em "2 + 3 ×" resolvemos 2+3 antes de registrar o ×.
    if (pendingOperation.value !== null && accumulator.value !== null && !awaitingOperand.value) {
      const result = await compute(pendingOperation.value, accumulator.value, display.value)
      if (result === null) return
      display.value = result
    }

    accumulator.value = display.value
    pendingOperation.value = operation
    awaitingOperand.value = true
    repeat.value = null
  }

  async function equals(): Promise<void> {
    if (busy.value) return
    recoverFromError()

    if (pendingOperation.value !== null && accumulator.value !== null) {
      // iOS: "2 + =" usa o próprio display como 2º operando (2 + 2).
      const operand = awaitingOperand.value ? accumulator.value : display.value
      const result = await compute(pendingOperation.value, accumulator.value, operand)
      if (result === null) return

      repeat.value = { operation: pendingOperation.value, operand }
      display.value = result
    } else if (repeat.value !== null) {
      const result = await compute(repeat.value.operation, display.value, repeat.value.operand)
      if (result === null) return
      display.value = result
    } else {
      return
    }

    accumulator.value = null
    pendingOperation.value = null
    awaitingOperand.value = true
  }

  async function percent(): Promise<void> {
    if (busy.value) return
    recoverFromError()

    const result = await compute('percent', display.value)
    if (result === null) return
    display.value = result
    // Resultado de uma operação: o próximo dígito começa número novo, mantendo o operador pendente.
    awaitingOperand.value = pendingOperation.value === null
  }

  /**
   * Inverter sinal é só manipulação de texto (sem aritmética),
   * então fica local: resposta instantânea e preserva entradas como "0." ou "5.".
   */
  function toggleSign(): void {
    if (busy.value) return
    recoverFromError()

    if (display.value === '0') return
    display.value = display.value.startsWith('-') ? display.value.slice(1) : `-${display.value}`
  }

  /** Apaga o último dígito (atalho de teclado: Backspace). */
  function backspace(): void {
    if (busy.value || awaitingOperand.value) return
    recoverFromError()

    const next = display.value.slice(0, -1)
    display.value = next === '' || next === '-' ? '0' : next
  }

  /** AC/C: "C" limpa só a entrada atual; "AC" zera tudo. */
  function clear(): void {
    if (busy.value) return
    if (clearLabel.value === 'C' && !hasError.value) {
      display.value = '0'
      return
    }
    resetAll()
  }

  return {
    // estado (somente leitura para a UI)
    display,
    errorMessage,
    busy,
    activeOperation,
    clearLabel,
    // ações
    inputDigit,
    inputDecimal,
    chooseOperation,
    equals,
    percent,
    toggleSign,
    backspace,
    clear,
  }
}
