import { describe, expect, it } from 'vitest'
import { countDigits, formatDisplay } from './formatDisplay'

describe('formatDisplay', () => {
  it.each([
    ['0', '0'],
    ['999', '999'],
    ['1000', '1.000'],
    ['1234567.5', '1.234.567,5'],
    ['-1234', '-1.234'],
    ['0.', '0,'],
    ['-0.', '-0,'],
    ['1.50', '1,50'],
  ])('%s -> %s', (raw, expected) => {
    expect(formatDisplay(raw)).toBe(expected)
  })
})

describe('countDigits', () => {
  it('ignora sinal e ponto decimal', () => {
    expect(countDigits('-12.34')).toBe(4)
  })
})
