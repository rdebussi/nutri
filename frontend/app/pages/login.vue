<!-- ====================================================
  PÁGINA DE LOGIN
  ====================================================
  Anatomia de um componente Vue 3 com Composition API:

  <script setup> → lógica (JavaScript/TypeScript)
  <template>     → HTML (o que aparece na tela)
  <style scoped> → CSS (estilo visual, isolado neste componente)

  "scoped" significa que o CSS só afeta ESTE componente.
  Sem scoped, um .form { } aqui mudaria TODOS os .form da app.
-->

<script setup lang="ts">
// definePageMeta é um macro do Nuxt (não precisa importar).
// Define metadados da página, como layout e middleware.
definePageMeta({
  layout: 'auth',
})

const authStore = useAuthStore()
const router = useRouter()

// ref() cria uma variável REATIVA.
// "Reativa" = quando o valor muda, o template re-renderiza automaticamente.
// Em React seria useState(). No Vue, é ref().
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e: unknown) {
    // Tipo "unknown" → TypeScript obriga a verificar antes de usar.
    // É mais seguro que "any" (que permite tudo sem verificar).
    if (e instanceof Error) {
      error.value = e.message
    } else {
      error.value = 'Erro ao fazer login'
    }
  } finally {
    // finally SEMPRE roda, deu certo ou não.
    // Garante que o loading para mesmo se der erro.
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <h1>Entrar</h1>

    <form @submit.prevent="handleSubmit" class="auth-form">
      <!-- @submit.prevent = addEventListener('submit') + preventDefault()
           Evita que o formulário recarregue a página (comportamento padrão HTML) -->

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <!-- v-model = two-way binding.
             Quando o usuário digita, atualiza a variável.
             Quando a variável muda, atualiza o input.
             Em React seria value={email} + onChange={setEmail}. -->
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
          autocomplete="current-password"
        />
      </div>

      <!-- :disabled = bind dinâmico. O botão fica desabilitado enquanto loading é true. -->
      <button type="submit" :disabled="loading" class="btn-primary">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>

      <p class="auth-link">
        Não tem conta?
        <!-- NuxtLink = como <a> mas sem recarregar a página (SPA navigation) -->
        <NuxtLink to="/register">Criar conta</NuxtLink>
      </p>
    </form>
  </div>
</template>

<style scoped>
.auth-page {
  max-width: 400px;
  margin: 4rem auto;
  padding: 0 1rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-weight: 600;
  font-size: 0.875rem;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.btn-primary {
  padding: 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #059669;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 0.875rem;
}

.auth-link {
  text-align: center;
  font-size: 0.875rem;
  color: #666;
}

.auth-link a {
  color: #10b981;
  text-decoration: none;
  font-weight: 600;
}
</style>
