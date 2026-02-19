// ====================================================
// SETUP GLOBAL DOS TESTES (Vitest)
// ====================================================
// Configura mocks para auto-imports do Nuxt que não estão
// disponíveis fora do contexto do Nuxt.

import { vi } from 'vitest'

// Mock global do useApi — cada teste pode customizar o retorno
const mockApi = vi.fn(async () => ({}))

vi.stubGlobal('useApi', () => ({
  api: mockApi,
}))

// Mock global de auto-imports do Nuxt usados em componentes
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { apiBase: 'http://localhost:3000/api/v1' },
}))

vi.stubGlobal('useCookie', () => ({ value: 'mock-token' }))
vi.stubGlobal('definePageMeta', () => {})
vi.stubGlobal('navigateTo', () => {})

// Exporta o mock para uso nos testes
export { mockApi }
