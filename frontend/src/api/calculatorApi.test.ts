import { describe, expect, it, vi } from 'vitest'
import { ApiError, createCalculatorApi } from './calculatorApi'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('createCalculatorApi', () => {
  it('envia a operação e devolve o resultado', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ result: '0.3' }))
    const api = createCalculatorApi('http://api.test', fetchFn)

    await expect(api.calculate('add', '0.1', '0.2')).resolves.toBe('0.3')

    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('http://api.test/api/calculate')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ operation: 'add', a: '0.1', b: '0.2' })
  })

  it('omite "b" em operações unárias', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ result: '0.5' }))

    await createCalculatorApi('', fetchFn).calculate('percent', '50')

    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ operation: 'percent', a: '50' })
  })

  it('lança ApiError com a mensagem do back-end', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: { message: 'Não é possível dividir por zero.' } }, 422))

    const promise = createCalculatorApi('', fetchFn).calculate('divide', '1', '0')

    await expect(promise).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'Não é possível dividir por zero.',
    })
  })

  it('lança ApiError quando a rede falha', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(createCalculatorApi('', fetchFn).calculate('add', '1', '1')).rejects.toBeInstanceOf(ApiError)
  })
})
