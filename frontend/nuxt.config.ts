export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxt/ui', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  // Força light mode — sem dark mode automático
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },

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
