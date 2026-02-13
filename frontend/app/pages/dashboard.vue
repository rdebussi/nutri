<script setup lang="ts">
// ====================================================
// DASHBOARD — Página protegida
// ====================================================
// Esta página só é acessível por usuários logados.
// O middleware 'auth' (que criaremos) redireciona
// para /login se não tiver token.

definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()

// onMounted roda quando o componente aparece na tela.
// É o equivalente do useEffect(() => {}, []) do React.
// Usamos para buscar os dados do usuário quando a página carrega.
onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Nutri</h1>
      <button @click="authStore.logout()" class="btn-logout">
        Sair
      </button>
    </header>

    <main class="dashboard-content">
      <section v-if="authStore.user" class="welcome">
        <h2>Olá, {{ authStore.user.name }}!</h2>
        <p>Bem-vindo ao Nutri. Em breve você poderá gerar sua dieta personalizada.</p>
      </section>

      <section v-else class="loading">
        <p>Carregando...</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.dashboard-header h1 {
  color: #10b981;
  font-size: 1.5rem;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-logout:hover {
  background: #f3f4f6;
}

.dashboard-content {
  padding: 2rem 0;
}

.welcome h2 {
  margin-bottom: 0.5rem;
}

.welcome p {
  color: #666;
}
</style>
