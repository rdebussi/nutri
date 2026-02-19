<!-- ====================================================
  VISUALIZAÇÃO DE DIETA — Dieta Base
  ====================================================
  [id].vue → rota dinâmica no Nuxt!
  O nome do arquivo entre colchetes vira um parâmetro.
  /diets/abc123 → useRoute().params.id = "abc123"

  FASE 5: Swap + Refresh na dieta base.
  - Swap: troca alimento permanentemente (altera a dieta base)
  - Refresh: regenera refeição com IA (mesmas calorias, ingredientes diferentes)
  - Limites de refresh: FREE=2/dia, PRO=10/dia, ADMIN=ilimitado
-->

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const dietStore = useDietStore()
const foodStore = useFoodStore()

const loading = ref(true)

// Micronutrientes: seção colapsável + gênero do usuário
const showMicros = ref(false)
const userGender = ref<'MALE' | 'FEMALE'>('MALE')

onMounted(async () => {
  try {
    await dietStore.fetchById(route.params.id as string)
  } finally {
    loading.value = false
  }

  // Tenta obter o gênero do perfil do usuário (para RDA dos micros)
  try {
    const { api } = useApi()
    const profile = await api<{ gender?: string }>('/users/me/profile')
    if (profile?.gender === 'FEMALE') userGender.value = 'FEMALE'
  } catch {
    // Fallback: MALE (default)
  }
})

const diet = computed(() => dietStore.currentDiet)

// ====================================================
// SWAP — Troca permanente de alimento na dieta base
// ====================================================
const showSwapModal = ref(false)
const swapTarget = ref<{ mealIndex: number; foodIndex: number; name: string; calories: number } | null>(null)
const swappedCell = ref<{ mealIndex: number; foodIndex: number } | null>(null)

function openSwapModal(mealIndex: number, foodIndex: number, foodName: string, calories: number) {
  swapTarget.value = { mealIndex, foodIndex, name: foodName, calories }
  showSwapModal.value = true
}

async function handleSwap(newFoodId: string) {
  if (!swapTarget.value || !diet.value) return

  const { mealIndex, foodIndex } = swapTarget.value
  const selectedFood = foodStore.foods.find(f => f._id === newFoodId)

  // Salva estado anterior para rollback
  const oldDiet = JSON.parse(JSON.stringify(diet.value))

  // Update otimista
  if (selectedFood) {
    const targetCalories = swapTarget.value.calories
    const equivalentGrams = previewEquivalentGrams(targetCalories, selectedFood.caloriesPer100g)
    const factor = equivalentGrams / 100

    const optimisticFood = {
      name: selectedFood.name,
      quantity: `${equivalentGrams}g`,
      calories: Math.round(selectedFood.caloriesPer100g * factor),
      protein: Math.round(selectedFood.proteinPer100g * factor),
      carbs: Math.round(selectedFood.carbsPer100g * factor),
      fat: Math.round(selectedFood.fatPer100g * factor),
    }

    diet.value.meals[mealIndex].foods[foodIndex] = optimisticFood
    recalcDietTotals()
  }

  // Animação
  swappedCell.value = { mealIndex, foodIndex }
  setTimeout(() => { swappedCell.value = null }, 700)

  // Fecha modal
  showSwapModal.value = false
  swapTarget.value = null

  // Sincroniza com backend (swap permanente na dieta base)
  try {
    const updatedDiet = await foodStore.swapFood(
      diet.value!._id,
      mealIndex,
      foodIndex,
      newFoodId,
    )
    if (updatedDiet) {
      dietStore.currentDiet = updatedDiet as typeof dietStore.currentDiet
    }
  } catch {
    // Rollback
    dietStore.currentDiet = oldDiet
  }
}

function previewEquivalentGrams(targetCalories: number, caloriesPer100g: number): number {
  if (caloriesPer100g === 0) return 100
  const rawGrams = (targetCalories / caloriesPer100g) * 100
  const rounded = Math.round(rawGrams / 5) * 5
  return Math.max(5, rounded)
}

function recalcDietTotals() {
  if (!diet.value) return
  for (const meal of diet.value.meals) {
    meal.totalCalories = Math.round(meal.foods.reduce((s, f) => s + f.calories, 0))
  }
  diet.value.totalCalories = diet.value.meals.reduce((sum, m) => sum + m.totalCalories, 0)
  diet.value.totalProtein = Math.round(
    diet.value.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.protein, 0), 0),
  )
  diet.value.totalCarbs = Math.round(
    diet.value.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.carbs, 0), 0),
  )
  diet.value.totalFat = Math.round(
    diet.value.meals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.fat, 0), 0),
  )
}

// ====================================================
// REFRESH — Regenera refeição inteira com IA
// ====================================================
const refreshingMeal = ref<number | null>(null)

async function handleRefreshMeal(mealIndex: number) {
  if (!diet.value || refreshingMeal.value !== null) return

  refreshingMeal.value = mealIndex

  try {
    await dietStore.refreshMeal(diet.value._id, mealIndex)
  } catch {
    // erro já no dietStore.error
  } finally {
    refreshingMeal.value = null
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/dashboard" class="text-zinc-500 hover:text-emerald-600 text-sm">
        ← Voltar
      </NuxtLink>
      <h1 class="text-xl font-bold text-emerald-600">Dieta Base</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8 text-zinc-400">Carregando dieta...</div>

    <!-- Dieta -->
    <template v-else-if="diet">
      <!-- Info da dieta -->
      <UCard class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h2 class="font-semibold text-zinc-800">{{ diet.title }}</h2>
            <p class="text-xs text-zinc-400">
              Gerada em {{ new Date(diet.createdAt).toLocaleDateString('pt-BR') }}
            </p>
          </div>
          <UBadge v-if="dietStore.refreshesRemaining !== null" color="primary" variant="subtle">
            {{ dietStore.refreshesRemaining }} refresh(es) restante(s)
          </UBadge>
        </div>

        <!-- Macros resumo -->
        <div class="grid grid-cols-4 gap-3 mt-3">
          <div class="text-center p-2 bg-emerald-50 rounded-lg">
            <span class="block text-lg font-bold text-emerald-700">{{ diet.totalCalories }}</span>
            <span class="text-xs text-zinc-500">kcal</span>
          </div>
          <div class="text-center p-2 bg-blue-50 rounded-lg">
            <span class="block text-lg font-bold text-blue-700">{{ diet.totalProtein }}g</span>
            <span class="text-xs text-zinc-500">Proteína</span>
          </div>
          <div class="text-center p-2 bg-amber-50 rounded-lg">
            <span class="block text-lg font-bold text-amber-700">{{ diet.totalCarbs }}g</span>
            <span class="text-xs text-zinc-500">Carboidratos</span>
          </div>
          <div class="text-center p-2 bg-pink-50 rounded-lg">
            <span class="block text-lg font-bold text-pink-700">{{ diet.totalFat }}g</span>
            <span class="text-xs text-zinc-500">Gordura</span>
          </div>
        </div>
      </UCard>

      <!-- Micronutrientes -->
      <UCard v-if="diet.totalMicronutrients" class="mb-4">
        <div
          class="flex items-center justify-between cursor-pointer select-none"
          @click="showMicros = !showMicros"
        >
          <h3 class="text-sm font-semibold text-zinc-700">Micronutrientes (% RDA)</h3>
          <span class="text-xs text-zinc-400">{{ showMicros ? '▲ Fechar' : '▼ Expandir' }}</span>
        </div>
        <div v-if="showMicros" class="mt-3 pt-3 border-t border-zinc-100">
          <MicronutrientsSummary
            :micronutrients="diet.totalMicronutrients"
            :gender="userGender"
          />
        </div>
      </UCard>

      <!-- Erro de refresh -->
      <UAlert v-if="dietStore.error" color="error" :description="dietStore.error" class="mb-4" />

      <!-- Refeições -->
      <div class="space-y-3 mb-4">
        <UCard v-for="(meal, mIndex) in diet.meals" :key="mIndex">
          <!-- Header da refeição com botão refresh -->
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-zinc-800">{{ meal.name }}</span>
                <span class="text-xs text-zinc-400">{{ meal.time }}</span>
              </div>
              <p class="text-sm text-emerald-600 font-medium">
                {{ meal.totalCalories }} kcal
                <span class="text-zinc-400 text-xs ml-1">
                  P:{{ Math.round(meal.foods.reduce((s, f) => s + f.protein, 0)) }}g
                  C:{{ Math.round(meal.foods.reduce((s, f) => s + f.carbs, 0)) }}g
                  G:{{ Math.round(meal.foods.reduce((s, f) => s + f.fat, 0)) }}g
                </span>
              </p>
            </div>
            <UButton
              size="xs"
              variant="outline"
              color="primary"
              :loading="refreshingMeal === mIndex"
              :disabled="refreshingMeal !== null"
              title="Regenerar refeição com IA"
              @click="handleRefreshMeal(mIndex)"
            >
              &#8635; Refresh
            </UButton>
          </div>

          <!-- Skeleton durante refresh -->
          <div v-if="refreshingMeal === mIndex" class="mt-3 pt-3 border-t border-zinc-100 space-y-2">
            <div v-for="n in 3" :key="n" class="h-5 bg-zinc-100 rounded animate-pulse" />
          </div>

          <!-- Tabela de alimentos -->
          <div v-else class="mt-3 pt-3 border-t border-zinc-100">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-zinc-400 text-xs">
                  <th class="text-left font-normal pb-1">Alimento</th>
                  <th class="text-right font-normal pb-1">Qtd</th>
                  <th class="text-right font-normal pb-1">Kcal</th>
                  <th class="text-right font-normal pb-1">P</th>
                  <th class="text-right font-normal pb-1">C</th>
                  <th class="text-right font-normal pb-1">G</th>
                  <th class="w-8"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(food, fIdx) in meal.foods"
                  :key="`${mIndex}-${fIdx}`"
                  class="text-zinc-700 group"
                  :class="{ 'swap-flash': swappedCell?.mealIndex === mIndex && swappedCell?.foodIndex === fIdx }"
                >
                  <td class="py-0.5">{{ food.name }}</td>
                  <td class="text-right py-0.5">{{ food.quantity }}</td>
                  <td class="text-right py-0.5">{{ Math.round(food.calories) }}</td>
                  <td class="text-right py-0.5 text-zinc-400">{{ Math.round(food.protein) }}</td>
                  <td class="text-right py-0.5 text-zinc-400">{{ Math.round(food.carbs) }}</td>
                  <td class="text-right py-0.5 text-zinc-400">{{ Math.round(food.fat) }}</td>
                  <td class="text-right py-0.5">
                    <button
                      class="text-zinc-300 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Trocar alimento"
                      @click="openSwapModal(mIndex, fIdx, food.name, food.calories)"
                    >
                      &#8644;
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>

      <!-- Notas da IA -->
      <UCard v-if="diet.notes" class="mb-4">
        <h3 class="font-semibold text-zinc-800 text-sm mb-1">Observações</h3>
        <p class="text-sm text-zinc-600 leading-relaxed">{{ diet.notes }}</p>
      </UCard>

      <!-- Modal de troca (swap permanente na dieta base) -->
      <FoodSwapModal
        :open="showSwapModal"
        :target-food="swapTarget"
        @update:open="showSwapModal = $event"
        @swap="handleSwap"
      />
    </template>

    <!-- Sem dieta -->
    <UCard v-else class="text-center">
      <p class="text-zinc-500 mb-4">Dieta não encontrada.</p>
      <UButton to="/dashboard" color="primary">Voltar ao Dashboard</UButton>
    </UCard>
  </div>
</template>

<style scoped>
@keyframes swap-flash {
  0% {
    filter: blur(4px);
    opacity: 0.3;
    background-color: rgb(16 185 129 / 0.15);
  }
  50% {
    filter: blur(0);
    opacity: 1;
    background-color: rgb(16 185 129 / 0.1);
  }
  100% {
    filter: blur(0);
    opacity: 1;
    background-color: transparent;
  }
}

.swap-flash td {
  animation: swap-flash 0.7s ease-out;
}
</style>
