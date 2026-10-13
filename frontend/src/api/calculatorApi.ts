/**
 * Cliente HTTP da API PHP.
 *
 * Boas práticas aplicadas:
 *  - Contrato tipado (Operation) espelhando o enum PHP `App\Domain\Operation`.
 *  - Interface `CalculatorApi`: a UI depende da abstração, não do `fetch`
 *    -> nos testes injetamos uma versão falsa, sem rede.
 *  - `baseUrl` e `fetch` injetáveis (inversão de dependência).
 *  - Erros da API viram `ApiError` com a mensagem vinda do back-end.
 */

export type Operation = 'add' | 'subtract' | 'multiply' | 'divide' | 'percent' | 'negate'
export type BinaryOperation = Extract<Operation, 'add' | 'subtract' | 'multiply' | 'divide'>

export interface CalculatorApi {
  /** Operandos e resultado são `string` para preservar a precisão decimal. */
  calculate(operation: Operation, a: string, b?: string): Promise<string>
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface ErrorBody {
  error?: { message?: string }
}

interface CalculateBody {
  result: string
}

export function createCalculatorApi(
  baseUrl = '',
  fetchFn: typeof fetch = (...args) => fetch(...args),
): CalculatorApi {
  return {
    async calculate(operation, a, b) {
      let response: Response
      try {
        response = await fetchFn(`${baseUrl}/api/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          // JSON.stringify ignora campos `undefined`, então operações unárias omitem "b".
          body: JSON.stringify({ operation, a, b }),
        })
      } catch {
        // fetch só rejeita em falha de rede (servidor fora do ar, CORS, offline).
        throw new ApiError('Não foi possível conectar ao servidor.', 0)
      }

      const body: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const message = (body as ErrorBody | null)?.error?.message ?? 'Erro inesperado.'
        throw new ApiError(message, response.status)
      }

      return (body as CalculateBody).result
    },
  }
}
