export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  typescript: {
    strict: true,
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000/api/v1',
    },
  },
})
