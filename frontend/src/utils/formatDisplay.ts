/**
 * Formata a string "crua" do display para exibição (padrão pt-BR).
 *
 * Por que não usar `Intl.NumberFormat`? Ele converte para Number e perde
 * o que o usuário digitou: "1." viraria "1" e "1.50" viraria "1,5".
 * Aqui só inserimos separadores, preservando exatamente a entrada.
 *
 *   "1234567.5" -> "1.234.567,5"
 *   "-0."       -> "-0,"
 *   "1.50"      -> "1,50"
 */
export function formatDisplay(raw: string, groupSeparator = '.', decimalSeparator = ','): string {
  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const [integerPart = '', fractionPart] = unsigned.split('.')

  // Regex: insere o separador antes de cada bloco de 3 dígitos contado do fim.
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)

  const decimals = fractionPart === undefined ? '' : `${decimalSeparator}${fractionPart}`

  return `${negative ? '-' : ''}${grouped}${decimals}`
}

/** Conta só os dígitos (ignora sinal e ponto) para limitar a digitação. */
export function countDigits(raw: string): number {
  return raw.replace(/[^0-9]/g, '').length
}
