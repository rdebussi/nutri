// ====================================================
// COMPOSABLE: useApi
// ====================================================
// Um "composable" é uma função que encapsula lógica reativa
// reutilizável. Convenção do Vue: sempre começa com "use".
//
// useApi() centraliza TODAS as chamadas HTTP para o backend.
// Assim, não precisamos repetir a baseURL e o header de
// autenticação em cada página.
//
// $fetch é a função HTTP nativa do Nuxt (baseada no "ofetch").
// É como o axios, mas mais leve e já integrada com o Nuxt.

export function useApi() {
  const config = useRuntimeConfig()
  const authToken = useCookie('auth_token')

  // Função genérica para chamadas à API.
  // O <T> é um "generic" do TypeScript:
  // permite que quem chama defina o tipo de retorno.
  // Ex: api<User>('/users/me') → retorna User
  async function api<T>(
    path: string,
    options: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> {
    const headers: Record<string, string> = {}

    if (authToken.value) {
      headers['Authorization'] = `Bearer ${authToken.value}`
    }

    const response = await $fetch<{ success: boolean; data: T }>(path, {
      baseURL: config.public.apiBase as string,
      headers,
      ...options,
    })

    return response.data
  }

  return { api }
}
