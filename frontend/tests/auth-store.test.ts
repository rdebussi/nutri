import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// Mock das funções do Nuxt que o store usa.
// Como o Vitest roda fora do Nuxt, essas funções não existem.
// vi.stubGlobal() coloca elas no escopo global (onde o Nuxt normalmente injeta).
vi.stubGlobal('useCookie', () => ref(null))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://localhost:3000/api/v1' } }))
vi.stubGlobal('useApi', () => ({ api: vi.fn() }))

import { useAuthStore } from '../stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with no user', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })

  it('isLoggedIn is true when user exists', () => {
    const store = useAuthStore()
    store.user = {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      role: 'FREE',
      createdAt: new Date().toISOString(),
    }
    expect(store.isLoggedIn).toBe(true)
  })

  it('logout clears user', () => {
    const store = useAuthStore()
    store.user = {
      id: '1',
      email: 'test@test.com',
      name: 'Test',
      role: 'FREE',
      createdAt: new Date().toISOString(),
    }

    store.logout()

    expect(store.user).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })
})
