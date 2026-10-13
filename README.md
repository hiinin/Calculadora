# Calculadora estilo iPhone

Projeto de estudo: **back-end PHP** (API REST) + **front-end Vue 3** com visual inspirado na calculadora do iOS.

```
Calculadora/
├── backend/    PHP 8 · Slim 4 · PHP-DI · brick/math · PHPUnit
└── frontend/   Vue 3 · TypeScript · Vite · Tailwind CSS v4 · Vitest
```

## Como rodar

Requisitos: PHP ≥ 8.2, Composer, Node ≥ 20.

```bash
# Terminal 1 – API em http://localhost:8080
cd backend
composer install
cp .env.example .env
composer start

# Terminal 2 – Front em http://localhost:5173
cd frontend
npm install
npm run dev
```

Testes: `composer test` (backend) e `npm test` (frontend).

## Arquitetura

```
[Vue UI] → useCalculator (máquina de estados) → calculatorApi (fetch)
                                                      │  POST /api/calculate
                                                      ▼
            Controller (HTTP) → Calculator (domínio, brick/math)
```

### Back-end (`backend/src`)

| Arquivo | Responsabilidade | Conceito para estudar |
|---|---|---|
| `Domain/Operation.php` | Operações válidas | *Backed enum* (PHP 8.1) |
| `Domain/Calculator.php` | Regras de cálculo | Domínio puro, `BigDecimal` (sem erro de float: `0.1+0.2=0.3`) |
| `Domain/Exception/` | Erros de negócio | Exceções nomeadas e *named constructors* |
| `Http/Controller/` | Valida entrada e responde JSON | Controller fino, injeção de dependência |
| `Http/Middleware/CorsMiddleware.php` | Permite o front chamar a API | CORS e *preflight* |
| `Http/ErrorHandler.php` | Erros → JSON padronizado | 422 (negócio) vs 500 (não vaza detalhes) |
| `Bootstrap.php` | Monta a aplicação | *Composition root*, ordem de middlewares |

**Endpoints**

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/api/health` | – | `{"status":"ok"}` |
| GET | `/api/operations` | – | lista de operações |
| POST | `/api/calculate` | `{"operation":"add","a":"0.1","b":"0.2"}` | `{"result":"0.3"}` |

Operações: `add`, `subtract`, `multiply`, `divide`, `percent`, `negate` (as duas últimas dispensam `b`).
Erros: `{"error":{"message":"..."}}` com status 422 (entrada/negócio), 404/405 ou 500.

### Front-end (`frontend/src`)

| Arquivo | Responsabilidade | Conceito para estudar |
|---|---|---|
| `api/calculatorApi.ts` | Cliente HTTP tipado | Interface + injeção de `fetch` (testável) |
| `composables/useCalculator.ts` | Comportamento da calculadora | Composition API, máquina de estados |
| `utils/formatDisplay.ts` | Formata `1234.5` → `1.234,5` | Preservar a entrada do usuário |
| `components/CalcButton.vue` | Botão com variantes | Props, classes Tailwind estáticas |
| `components/CalcKeypad.vue` | Teclado | *Props down, events up* |
| `components/CalcDisplay.vue` | Visor com fonte adaptativa | `computed`, acessibilidade (`aria-live`) |
| `App.vue` | Liga tudo + atalhos de teclado | Ciclo de vida (`onMounted`/`onBeforeUnmount`) |

Em desenvolvimento o Vite faz *proxy* de `/api` para o PHP (`vite.config.ts`), então não há problema de CORS. Em produção, defina `VITE_API_URL` e `CORS_ORIGINS`.

### Decisões de projeto

- **Strings no lugar de números** entre front e back para não perder precisão decimal.
- **Cálculo no servidor** (objetivo didático); inverter sinal é local por ser só manipulação de texto.
- **Testes em todas as camadas**: unidade (domínio, composable), integração (API Slim em memória) e componente (Vue Test Utils).
- **Comportamento do iOS**: encadeamento (`2+3×4`), `=` repetido, `AC`/`C`, operador destacado, limite de 9 dígitos, atalhos de teclado.

## Histórico de commits

Cada etapa foi um commit (`git log --oneline`): scaffold → domínio → API → scaffold do front → cliente HTTP → formatação → máquina de estados → UI → testes de componente.
