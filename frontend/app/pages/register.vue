<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const authStore = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await authStore.register(email.value, password.value, name.value)
    router.push('/dashboard')
  } catch (e: unknown) {
    if (e instanceof Error) {
      error.value = e.message
    } else {
      error.value = 'Erro ao criar conta'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <h1>Criar Conta</h1>

    <form @submit.prevent="handleSubmit" class="auth-form">
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-group">
        <label for="name">Nome</label>
        <input
          id="name"
          v-model="name"
          type="text"
          placeholder="Seu nome"
          required
          autocomplete="name"
        />
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="seu@email.com"
          required
          autocomplete="email"
        />
      </div>

      <div class="form-group">
        <label for="password">Senha</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          required
          minlength="8"
          autocomplete="new-password"
        />
      </div>

      <button type="submit" :disabled="loading" class="btn-primary">
        {{ loading ? 'Criando...' : 'Criar Conta' }}
      </button>

      <p class="auth-link">
        Já tem conta?
        <NuxtLink to="/login">Entrar</NuxtLink>
      </p>
    </form>
  </div>
</template>

<!-- Reutilizamos os mesmos estilos da página de login -->
<style scoped>
.auth-page { max-width: 400px; margin: 4rem auto; padding: 0 1rem; }
.auth-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; }
label { font-weight: 600; font-size: 0.875rem; }
input { padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
.btn-primary { padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; }
.btn-primary:hover { background: #059669; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error-message { padding: 0.75rem; background: #fef2f2; color: #dc2626; border-radius: 6px; font-size: 0.875rem; }
.auth-link { text-align: center; font-size: 0.875rem; color: #666; }
.auth-link a { color: #10b981; text-decoration: none; font-weight: 600; }
</style>
