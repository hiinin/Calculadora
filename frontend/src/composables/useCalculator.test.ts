import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError, type CalculatorApi, type Operation } from '../api/calculatorApi'
import { useCalculator } from './useCalculator'

/**
 * API falsa: implementa a matemática em memória (sem rede).
 * Isso isola o teste na lógica da máquina de estados, não no back-end.
 */
const fakeApi: CalculatorApi = {
  async calculate(operation: Operation, a: string, b?: string) {
    const x = Number(a)
    const y = Number(b)
    switch (operation) {
      case 'add':
        return String(x + y)
      case 'subtract':
        return String(x - y)
      case 'multiply':
        return String(x * y)
      case 'divide':
        if (y === 0) throw new ApiError('Não é possível dividir por zero.', 422)
        return String(x / y)
      case 'percent':
        return String(x / 100)
      case 'negate':
        return String(-x)
    }
  },
}

type Calc = ReturnType<typeof useCalculator>

function typeNumber(calc: Calc, text: string): void {
  for (const char of text) {
    if (char === '.') calc.inputDecimal()
    else calc.inputDigit(char)
  }
}

describe('useCalculator', () => {
  let calc: Calc

  beforeEach(() => {
    calc = useCalculator(fakeApi)
  })

  it('digita números sem zeros à esquerda', () => {
    typeNumber(calc, '007')
    expect(calc.display.value).toBe('7')
  })

  it('aceita apenas um ponto decimal', () => {
    typeNumber(calc, '1.2.3')
    expect(calc.display.value).toBe('1.23')
  })

  it('limita a 9 dígitos', () => {
    typeNumber(calc, '1234567890')
    expect(calc.display.value).toBe('123456789')
  })

  it('soma dois números', async () => {
    typeNumber(calc, '2')
    await calc.chooseOperation('add')
    typeNumber(calc, '3')
    await calc.equals()
    expect(calc.display.value).toBe('5')
  })

  it('encadeia operações: 2 + 3 × 4 = 20', async () => {
    typeNumber(calc, '2')
    await calc.chooseOperation('add')
    typeNumber(calc, '3')
    await calc.chooseOperation('multiply')
    expect(calc.display.value).toBe('5')
    typeNumber(calc, '4')
    await calc.equals()
    expect(calc.display.value).toBe('20')
  })

  it('repete a última operação com "=" consecutivos', async () => {
    typeNumber(calc, '2')
    await calc.chooseOperation('add')
    typeNumber(calc, '3')
    await calc.equals()
    await calc.equals()
    await calc.equals()
    expect(calc.display.value).toBe('11')
  })

  it('"2 + =" usa o display como 2º operando', async () => {
    typeNumber(calc, '2')
    await calc.chooseOperation('add')
    await calc.equals()
    expect(calc.display.value).toBe('4')
  })

  it('digitar após "=" inicia cálculo novo', async () => {
    typeNumber(calc, '2')
    await calc.chooseOperation('add')
    typeNumber(calc, '3')
    await calc.equals()
    typeNumber(calc, '9')
    expect(calc.display.value).toBe('9')
    await calc.equals() // sem operação pendente nem repetição: nada acontece
    expect(calc.display.value).toBe('9')
  })

  it('destaca o operador ativo apenas enquanto aguarda o 2º número', async () => {
    typeNumber(calc, '2')
    await calc.chooseOperation('divide')
    expect(calc.activeOperation.value).toBe('divide')
    typeNumber(calc, '1')
    expect(calc.activeOperation.value).toBeNull()
  })

  it('trocar o operador antes do 2º número só substitui o operador', async () => {
    typeNumber(calc, '8')
    await calc.chooseOperation('add')
    await calc.chooseOperation('subtract')
    typeNumber(calc, '3')
    await calc.equals()
    expect(calc.display.value).toBe('5')
  })

  it('divisão por zero mostra erro e recomeça na próxima tecla', async () => {
    typeNumber(calc, '5')
    await calc.chooseOperation('divide')
    typeNumber(calc, '0')
    await calc.equals()

    expect(calc.display.value).toBe('Erro')
    expect(calc.errorMessage.value).toBe('Não é possível dividir por zero.')

    typeNumber(calc, '7')
    expect(calc.display.value).toBe('7')
    expect(calc.errorMessage.value).toBeNull()
  })

  it('percent divide por 100', async () => {
    typeNumber(calc, '50')
    await calc.percent()
    expect(calc.display.value).toBe('0.5')
  })

  it('inverte o sinal sem tocar no zero', () => {
    calc.toggleSign()
    expect(calc.display.value).toBe('0')
    typeNumber(calc, '5')
    calc.toggleSign()
    expect(calc.display.value).toBe('-5')
    calc.toggleSign()
    expect(calc.display.value).toBe('5')
  })

  it('backspace apaga o último dígito e volta a 0', () => {
    typeNumber(calc, '12')
    calc.backspace()
    expect(calc.display.value).toBe('1')
    calc.backspace()
    expect(calc.display.value).toBe('0')
  })

  it('alterna entre C e AC', async () => {
    expect(calc.clearLabel.value).toBe('AC')
    typeNumber(calc, '5')
    expect(calc.clearLabel.value).toBe('C')

    await calc.chooseOperation('add')
    typeNumber(calc, '7')
    calc.clear() // C: limpa só a entrada atual
    expect(calc.display.value).toBe('0')
    expect(calc.clearLabel.value).toBe('AC')

    calc.clear() // AC: zera tudo
    typeNumber(calc, '1')
    await calc.equals()
    expect(calc.display.value).toBe('1')
  })
})
