export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  typescript: {
    strict: true,
  },

  devServer: {
    port: 3001,
  },

  imports: {
    dirs: ['stores', 'composables'],
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000/api/v1',
    },
  },
})
