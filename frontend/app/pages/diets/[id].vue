<!-- ====================================================
  VISUALIZAÇÃO DE DIETA
  ====================================================
  [id].vue → rota dinâmica no Nuxt!
  O nome do arquivo entre colchetes vira um parâmetro.
  /diets/abc123 → useRoute().params.id = "abc123"

  É como o :id do Express/Fastify, mas definido pelo nome do arquivo.
-->

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const dietStore = useDietStore()

const loading = ref(true)

onMounted(async () => {
  try {
    await dietStore.fetchById(route.params.id as string)
  } finally {
    loading.value = false
  }
})

// computed: recalcula automaticamente quando dietStore.currentDiet muda
const diet = computed(() => dietStore.currentDiet)
</script>

<template>
  <div class="diet-page">
    <header class="page-header">
      <NuxtLink to="/dashboard" class="back-link">← Voltar</NuxtLink>
    </header>

    <div v-if="loading" class="loading">Carregando dieta...</div>

    <template v-else-if="diet">
      <div class="diet-header">
        <h1>{{ diet.title }}</h1>
        <p class="diet-date">
          Gerada em {{ new Date(diet.createdAt).toLocaleDateString('pt-BR') }}
        </p>
      </div>

      <!-- Resumo de macronutrientes -->
      <div class="macros-summary">
        <div class="macro-card">
          <span class="macro-value">{{ diet.totalCalories }}</span>
          <span class="macro-label">kcal</span>
        </div>
        <div class="macro-card protein">
          <span class="macro-value">{{ diet.totalProtein }}g</span>
          <span class="macro-label">Proteína</span>
        </div>
        <div class="macro-card carbs">
          <span class="macro-value">{{ diet.totalCarbs }}g</span>
          <span class="macro-label">Carboidratos</span>
        </div>
        <div class="macro-card fat">
          <span class="macro-value">{{ diet.totalFat }}g</span>
          <span class="macro-label">Gordura</span>
        </div>
      </div>

      <!-- Refeições -->
      <div class="meals">
        <div v-for="(meal, index) in diet.meals" :key="index" class="meal-card">
          <div class="meal-header">
            <h2>{{ meal.name }}</h2>
            <span class="meal-time">{{ meal.time }}</span>
            <span class="meal-calories">{{ meal.totalCalories }} kcal</span>
          </div>

          <table class="foods-table">
            <thead>
              <tr>
                <th>Alimento</th>
                <th>Quantidade</th>
                <th>Kcal</th>
                <th>P</th>
                <th>C</th>
                <th>G</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(food, fIndex) in meal.foods" :key="fIndex">
                <td>{{ food.name }}</td>
                <td>{{ food.quantity }}</td>
                <td>{{ food.calories }}</td>
                <td>{{ food.protein }}g</td>
                <td>{{ food.carbs }}g</td>
                <td>{{ food.fat }}g</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notas da IA -->
      <div v-if="diet.notes" class="notes">
        <h3>Observações</h3>
        <p>{{ diet.notes }}</p>
      </div>
    </template>

    <div v-else class="error">Dieta não encontrada.</div>
  </div>
</template>

<style scoped>
.diet-page { max-width: 800px; margin: 0 auto; padding: 1rem; }

.page-header { padding: 1rem 0; }
.back-link { color: #10b981; text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }

.diet-header { margin-bottom: 1.5rem; }
.diet-header h1 { color: #1f2937; margin-bottom: 0.25rem; }
.diet-date { color: #999; font-size: 0.875rem; }

.macros-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.macro-card {
  text-align: center;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 8px;
}
.macro-card.protein { background: #eff6ff; }
.macro-card.carbs { background: #fefce8; }
.macro-card.fat { background: #fdf2f8; }

.macro-value { display: block; font-size: 1.5rem; font-weight: 700; }
.macro-label { font-size: 0.75rem; color: #666; text-transform: uppercase; }

.meal-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 1rem;
  overflow: hidden;
}

.meal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
}
.meal-header h2 { font-size: 1rem; flex: 1; }
.meal-time { color: #666; font-size: 0.875rem; }
.meal-calories { font-weight: 600; color: #10b981; font-size: 0.875rem; }

.foods-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.foods-table th {
  text-align: left;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  color: #666;
  font-size: 0.75rem;
  text-transform: uppercase;
}
.foods-table td { padding: 0.5rem 1rem; border-bottom: 1px solid #f5f5f5; }

.notes {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fffbeb;
  border-radius: 8px;
}
.notes h3 { font-size: 0.875rem; margin-bottom: 0.5rem; }
.notes p { color: #666; font-size: 0.875rem; line-height: 1.5; }

.loading, .error { text-align: center; padding: 3rem; color: #999; }
</style>
