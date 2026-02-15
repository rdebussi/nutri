<!-- ====================================================
  DASHBOARD — Área logada principal
  ====================================================
  O dashboard tem 3 funções:
  1. Check-in do dia (comeu/não comeu) + progresso semanal
  2. Botão para gerar nova dieta
  3. Lista de dietas anteriores (histórico)
-->

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()
const dietStore = useDietStore()
const checkinStore = useCheckinStore()
const router = useRouter()

// onMounted = roda quando a página aparece na tela.
// Buscamos todos os dados em paralelo com Promise.all().
onMounted(async () => {
  await Promise.all([
    authStore.user ? Promise.resolve() : authStore.fetchUser(),
    dietStore.fetchAll(),
    checkinStore.fetchToday(),
  ])
})

async function handleGenerate() {
  try {
    const diet = await dietStore.generate()
    if (diet?._id) {
      router.push(`/diets/${diet._id}`)
    }
  } catch {
    // erro já está no dietStore.error
  }
}
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Nutri</h1>
      <div class="header-actions">
        <span v-if="authStore.user" class="user-name">{{ authStore.user.name }}</span>
        <button @click="authStore.logout()" class="btn-outline">Sair</button>
      </div>
    </header>

    <main class="dashboard-content">
      <!-- Seção de check-in do dia -->
      <section v-if="dietStore.diets.length" class="checkin-section">
        <div class="checkin-status">
          <div>
            <h2>Hoje</h2>
            <p v-if="checkinStore.todayCheckIn">
              Aderência: <strong>{{ checkinStore.todayCheckIn.adherenceRate }}%</strong>
            </p>
            <p v-else>Registre suas refeições de hoje</p>
          </div>
          <NuxtLink to="/check-in" class="btn-checkin">
            {{ checkinStore.todayCheckIn ? 'Atualizar Check-in' : 'Fazer Check-in' }}
          </NuxtLink>
        </div>
      </section>

      <!-- Progresso semanal -->
      <section v-if="dietStore.diets.length" class="progress-section">
        <WeeklyProgress />
      </section>

      <!-- Seção de geração -->
      <section class="generate-section">
        <h2>Gerar Nova Dieta</h2>
        <p>Clique no botão abaixo e a IA vai criar um plano alimentar personalizado para você.</p>

        <div v-if="dietStore.error" class="error-message">
          {{ dietStore.error }}
        </div>

        <button
          @click="handleGenerate"
          :disabled="dietStore.generating"
          class="btn-primary btn-large"
        >
          <!-- Ternário no template: condição ? verdadeiro : falso
               Muda o texto do botão conforme o estado -->
          {{ dietStore.generating ? 'Gerando dieta...' : 'Gerar Dieta com IA' }}
        </button>

        <p v-if="dietStore.generating" class="generating-hint">
          Isso pode levar alguns segundos...
        </p>
      </section>

      <!-- Histórico de dietas -->
      <section v-if="dietStore.diets.length" class="history-section">
        <h2>Suas Dietas</h2>

        <!-- v-for = loop no template. Para cada dieta, renderiza um card.
             :key é obrigatório em loops — o Vue usa para identificar
             cada item e otimizar re-renderizações. -->
        <div class="diet-list">
          <NuxtLink
            v-for="diet in dietStore.diets"
            :key="diet._id"
            :to="`/diets/${diet._id}`"
            class="diet-card"
          >
            <h3>{{ diet.title }}</h3>
            <div class="diet-meta">
              <span>{{ diet.totalCalories }} kcal</span>
              <span>{{ new Date(diet.createdAt).toLocaleDateString('pt-BR') }}</span>
            </div>
          </NuxtLink>
        </div>
      </section>

      <section v-else-if="!dietStore.generating" class="empty-state">
        <p>Você ainda não tem dietas. Gere sua primeira!</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard { max-width: 800px; margin: 0 auto; padding: 1rem; }

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}
.dashboard-header h1 { color: #10b981; font-size: 1.5rem; }

.header-actions { display: flex; align-items: center; gap: 1rem; }
.user-name { font-size: 0.875rem; color: #666; }

.btn-outline {
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}
.btn-outline:hover { background: #f3f4f6; }

.dashboard-content { padding: 2rem 0; }

.generate-section {
  text-align: center;
  padding: 2rem;
  background: #f0fdf4;
  border-radius: 12px;
  margin-bottom: 2rem;
}
.generate-section h2 { margin-bottom: 0.5rem; }
.generate-section p { color: #666; margin-bottom: 1rem; }

.btn-primary {
  padding: 0.75rem 2rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:hover { background: #059669; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-large { padding: 1rem 2.5rem; font-size: 1.1rem; }

.generating-hint { color: #666; font-size: 0.875rem; margin-top: 0.5rem; }

.history-section h2 { margin-bottom: 1rem; }

.diet-list { display: flex; flex-direction: column; gap: 0.75rem; }

.diet-card {
  display: block;
  padding: 1rem 1.25rem;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s;
}
.diet-card:hover { border-color: #10b981; }
.diet-card h3 { margin-bottom: 0.25rem; font-size: 1rem; }

.diet-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #999;
}

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.empty-state { text-align: center; color: #999; padding: 2rem; }

.checkin-section {
  padding: 1.25rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.checkin-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.checkin-status h2 { font-size: 1.1rem; margin-bottom: 0.25rem; }
.checkin-status p { color: #666; font-size: 0.9rem; margin: 0; }

.btn-checkin {
  padding: 0.5rem 1.25rem;
  background: #10b981;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
}
.btn-checkin:hover { background: #059669; }

.progress-section { margin-bottom: 2rem; }
</style>
