import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// ====================================================
// AUTH STORE
// ====================================================
// Store global de autenticação. Qualquer componente em
// qualquer página pode:
// - Checar se o usuário está logado: authStore.isLoggedIn
// - Pegar dados do usuário: authStore.user
// - Fazer login/register/logout: authStore.login(...)
//
// Os tokens ficam em cookies (não localStorage) porque:
// 1. Cookies são enviados automaticamente pelo navegador
// 2. Cookies httpOnly não são acessíveis via JavaScript
//    (proteção contra XSS - se alguém injetar JS na página,
//    não consegue roubar o token)

export type User = {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

type AuthResponse = {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
  }
}

export const useAuthStore = defineStore('auth', () => {
  // ========== STATE ==========
  const user = ref<User | null>(null)

  // useCookie é um composable do Nuxt que lê/escreve cookies
  // de forma reativa (se mudar o cookie, o componente re-renderiza).
  const tokenCookie = useCookie('auth_token', { maxAge: 60 * 15 }) // 15min
  const refreshCookie = useCookie('refresh_token', { maxAge: 60 * 60 * 24 * 7 }) // 7 dias

  // ========== GETTERS ==========
  // computed = valor derivado que recalcula automaticamente
  // quando suas dependências mudam. Aqui, muda quando user muda.
  const isLoggedIn = computed(() => !!user.value)

  // ========== ACTIONS ==========
  async function register(email: string, password: string, name: string) {
    const { api } = useApi()

    const data = await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { email, password, name },
    })

    setAuthData(data)
    return data.user
  }

  async function login(email: string, password: string) {
    const { api } = useApi()

    const data = await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    setAuthData(data)
    return data.user
  }

  function logout() {
    user.value = null
    tokenCookie.value = null
    refreshCookie.value = null
    navigateTo('/login')
  }

  // Busca dados do usuário usando o token armazenado.
  // Chamado ao carregar a página para "relembrar" quem está logado.
  async function fetchUser() {
    if (!tokenCookie.value) return null

    try {
      const { api } = useApi()
      const data = await api<User & { profile: unknown }>('/users/me')
      user.value = data
      return data
    } catch {
      // Token inválido/expirado → limpa tudo
      logout()
      return null
    }
  }

  // ========== HELPERS ==========
  function setAuthData(data: AuthResponse) {
    user.value = data.user
    tokenCookie.value = data.tokens.accessToken
    refreshCookie.value = data.tokens.refreshToken
  }

  return {
    user,
    isLoggedIn,
    register,
    login,
    logout,
    fetchUser,
  }
})
