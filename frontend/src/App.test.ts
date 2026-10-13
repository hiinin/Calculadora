import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'

/** Teste de componente: monta a UI inteira e "clica" como um usuário, com `fetch` simulado. */
describe('App', () => {
  afterEach(() => vi.unstubAllGlobals())

  async function press(wrapper: ReturnType<typeof mount>, label: string): Promise<void> {
    const button = wrapper.findAll('button').find((b) => b.text() === label)
    if (!button) throw new Error(`Botão "${label}" não encontrado`)
    await button.trigger('click')
    await flushPromises()
  }

  it('calcula 12 ÷ 8 usando a API e formata o resultado em pt-BR', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ result: '1.5' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(App)
    for (const key of ['1', '2', '÷', '8', '=']) await press(wrapper, key)

    expect(wrapper.get('[data-testid="display"]').text()).toBe('1,5')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ operation: 'divide', a: '12', b: '8' })
  })

  it('mostra a mensagem de erro vinda da API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'Não é possível dividir por zero.' } }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const wrapper = mount(App)
    for (const key of ['1', '÷', '0', '=']) await press(wrapper, key)

    expect(wrapper.get('[role="alert"]').text()).toBe('Não é possível dividir por zero.')
    expect(wrapper.get('[data-testid="display"]').text()).toBe('Erro')
  })
})
