<!-- ====================================================
  CHECK-IN — Registro diário de refeições
  ====================================================
  O usuário marca quais refeições da dieta ele comeu.
  As refeições vêm da última dieta gerada.
  O check-in é salvo como um upsert (cria ou atualiza).
-->

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const dietStore = useDietStore()
const checkinStore = useCheckinStore()
const router = useRouter()

// Estado local para os checkboxes e notas
const mealStates = ref<Array<{ mealName: string; completed: boolean; notes: string }>>([])
const saving = ref(false)
const saved = ref(false)
const activeDiet = ref<typeof dietStore.currentDiet>(null)

onMounted(async () => {
  // Busca as dietas do usuário para encontrar a mais recente
  if (!dietStore.diets.length) {
    await dietStore.fetchAll()
  }

  // Usa a dieta mais recente como referência
  if (dietStore.diets.length > 0) {
    const latest = dietStore.diets[0]
    await dietStore.fetchById(latest._id)
    activeDiet.value = dietStore.currentDiet
  }

  // Busca check-in de hoje (se já existe)
  await checkinStore.fetchToday()

  // Inicializa os estados das refeições
  initializeMealStates()
})

function initializeMealStates() {
  if (!activeDiet.value) return

  const todayMeals = checkinStore.todayCheckIn?.meals

  mealStates.value = activeDiet.value.meals.map((meal) => {
    // Se já existe check-in de hoje, preenche com os dados salvos
    const existing = todayMeals?.find(m => m.mealName === meal.name)
    return {
      mealName: meal.name,
      completed: existing?.completed ?? false,
      notes: existing?.notes ?? '',
    }
  })
}

const completedCount = computed(() =>
  mealStates.value.filter(m => m.completed).length
)

const totalCount = computed(() => mealStates.value.length)

const adherencePercent = computed(() =>
  totalCount.value > 0
    ? Math.round((completedCount.value / totalCount.value) * 100)
    : 0
)

async function handleSave() {
  if (!activeDiet.value) return

  saving.value = true
  saved.value = false

  try {
    await checkinStore.submitCheckIn(
      activeDiet.value._id,
      mealStates.value.map(m => ({
        mealName: m.mealName,
        completed: m.completed,
        ...(m.notes ? { notes: m.notes } : {}),
      })),
    )
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch {
    // erro já está no checkinStore.error
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="checkin-page">
    <header class="checkin-header">
      <NuxtLink to="/dashboard" class="back-link">← Voltar</NuxtLink>
      <h1>Check-in do Dia</h1>
    </header>

    <!-- Sem dieta ativa -->
    <div v-if="!activeDiet" class="empty-state">
      <p>Você ainda não tem uma dieta gerada.</p>
      <NuxtLink to="/dashboard" class="btn-primary">Gerar Dieta</NuxtLink>
    </div>

    <!-- Com dieta ativa -->
    <main v-else>
      <div class="diet-info">
        <h2>{{ activeDiet.title }}</h2>
        <p>Marque as refeições que você seguiu hoje:</p>
      </div>

      <!-- Barra de progresso -->
      <div class="progress-bar-container">
        <div class="progress-bar" :style="{ width: `${adherencePercent}%` }"></div>
        <span class="progress-text">{{ completedCount }}/{{ totalCount }} refeições ({{ adherencePercent }}%)</span>
      </div>

      <!-- Lista de refeições -->
      <div class="meals-list">
        <div
          v-for="(meal, index) in mealStates"
          :key="meal.mealName"
          class="meal-item"
          :class="{ completed: meal.completed }"
        >
          <label class="meal-label">
            <input
              type="checkbox"
              v-model="meal.completed"
              class="meal-checkbox"
            />
            <div class="meal-info">
              <span class="meal-name">{{ meal.mealName }}</span>
              <span v-if="activeDiet.meals[index]" class="meal-time">
                {{ activeDiet.meals[index].time }} · {{ activeDiet.meals[index].totalCalories }} kcal
              </span>
            </div>
          </label>

          <!-- Campo de notas (aparece ao expandir) -->
          <input
            type="text"
            v-model="meal.notes"
            placeholder="Notas (opcional)"
            class="meal-notes"
          />
        </div>
      </div>

      <!-- Mensagens -->
      <div v-if="checkinStore.error" class="error-message">
        {{ checkinStore.error }}
      </div>

      <div v-if="saved" class="success-message">
        Check-in salvo com sucesso!
      </div>

      <!-- Botão salvar -->
      <button
        @click="handleSave"
        :disabled="saving"
        class="btn-primary btn-save"
      >
        {{ saving ? 'Salvando...' : 'Salvar Check-in' }}
      </button>
    </main>
  </div>
</template>

<style scoped>
.checkin-page { max-width: 600px; margin: 0 auto; padding: 1rem; }

.checkin-header {
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 1.5rem;
}
.checkin-header h1 { font-size: 1.5rem; color: #10b981; margin-top: 0.5rem; }

.back-link {
  color: #666;
  text-decoration: none;
  font-size: 0.875rem;
}
.back-link:hover { color: #10b981; }

.diet-info { margin-bottom: 1.5rem; }
.diet-info h2 { font-size: 1.1rem; margin-bottom: 0.25rem; }
.diet-info p { color: #666; font-size: 0.9rem; }

.progress-bar-container {
  background: #e5e7eb;
  border-radius: 8px;
  height: 32px;
  position: relative;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #10b981;
  border-radius: 8px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
}

.meals-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }

.meal-item {
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: border-color 0.2s, background 0.2s;
}
.meal-item.completed {
  border-color: #10b981;
  background: #f0fdf4;
}

.meal-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.meal-checkbox {
  width: 20px;
  height: 20px;
  accent-color: #10b981;
  cursor: pointer;
}

.meal-info { display: flex; flex-direction: column; }
.meal-name { font-weight: 600; font-size: 0.95rem; }
.meal-time { font-size: 0.8rem; color: #999; }

.meal-notes {
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  background: #fafafa;
}
.meal-notes:focus { outline: none; border-color: #10b981; }

.btn-primary {
  padding: 0.75rem 2rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}
.btn-primary:hover { background: #059669; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-save { width: 100%; padding: 1rem; font-size: 1.1rem; }

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.success-message {
  padding: 0.75rem;
  background: #f0fdf4;
  color: #059669;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
}

.empty-state { text-align: center; padding: 3rem; color: #666; }
.empty-state .btn-primary { margin-top: 1rem; }
</style>
