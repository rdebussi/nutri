// ====================================================
// MIDDLEWARE DE AUTENTICAÇÃO (NUXT)
// ====================================================
// No Nuxt, middleware é uma função que roda ANTES
// da página carregar. É diferente do middleware do backend:
//
// Backend middleware: intercepta HTTP requests no servidor
// Frontend middleware: intercepta navegação no browser
//
// defineNuxtRouteMiddleware é um helper do Nuxt que cria
// um middleware de rota. Ele recebe (to, from):
// - to: para onde o usuário está indo
// - from: de onde ele veio
//
// Se retornar navigateTo(), o Nuxt redireciona.
// Se não retornar nada, a navegação continua normal.

export default defineNuxtRouteMiddleware((_to, _from) => {
  const token = useCookie('auth_token')

  if (!token.value) {
    return navigateTo('/login')
  }
})
