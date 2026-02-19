<!-- ====================================================
  CHECK-IN — Registro diário de refeições adaptativas
  ====================================================
  FASE 3.4c: O usuário marca refeições como "comi", "pulei"
  ou "editar" para registrar o que realmente comeu.
  Quando uma refeição é editada/pulada ou exercício extra é
  feito, as refeições pendentes são recalculadas automaticamente.
-->

<script setup lang="ts">
type MealStatus = 'pending' | 'completed' | 'skipped'

definePageMeta({
  middleware: 'auth',
})

const dietStore = useDietStore()
const checkinStore = useCheckinStore()
const exerciseStore = useExerciseStore()
const foodStore = useFoodStore()

// Estado local
type MealState = { mealName: string; status: MealStatus; notes: string }
const mealStates = ref<MealState[]>([])
const saving = ref(false)
const saved = ref(false)
const activeDiet = ref<typeof dietStore.currentDiet>(null)
const expandedMeal = ref<string | null>(null) // qual meal está expandida

onMounted(async () => {
  if (!dietStore.diets.length) {
    await dietStore.fetchAll()
  }

  if (dietStore.diets.length > 0) {
    const latest = dietStore.diets[0]
    await dietStore.fetchById(latest._id)
    activeDiet.value = dietStore.currentDiet
  }

  await checkinStore.fetchToday()
  await exerciseStore.fetchExercises()
  initializeMealStates()
})

function initializeMealStates() {
  if (!activeDiet.value) return

  const todayMeals = checkinStore.todayCheckIn?.meals

  mealStates.value = activeDiet.value.meals.map((meal) => {
    const existing = todayMeals?.find(m => m.mealName === meal.name)
    return {
      mealName: meal.name,
      status: existing?.status ?? 'pending',
      notes: existing?.notes ?? '',
    }
  })
}

// Computed: contagem de status
const completedCount = computed(() => mealStates.value.filter(m => m.status === 'completed').length)
const skippedCount = computed(() => mealStates.value.filter(m => m.status === 'skipped').length)
const totalCount = computed(() => mealStates.value.length)
const adherencePercent = computed(() =>
  totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0,
)

// Busca a meal adaptada correspondente
function getAdaptedMeal(mealName: string) {
  return checkinStore.adaptedMeals.find(m => m.name === mealName)
}

// Macros da refeição: usa adapted se disponível, senão calcula dos foods originais
function getMealMacros(mealName: string, index: number) {
  const adapted = getAdaptedMeal(mealName)
  if (adapted) {
    return {
      totalCalories: adapted.totalCalories,
      totalProtein: adapted.totalProtein,
      totalCarbs: adapted.totalCarbs,
      totalFat: adapted.totalFat,
    }
  }
  // Fallback: soma dos foods originais da dieta
  const dietMeal = activeDiet.value?.meals[index]
  if (!dietMeal?.foods) return { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  return {
    totalCalories: dietMeal.totalCalories,
    totalProtein: dietMeal.foods.reduce((sum: number, f: any) => sum + (f.protein || 0), 0),
    totalCarbs: dietMeal.foods.reduce((sum: number, f: any) => sum + (f.carbs || 0), 0),
    totalFat: dietMeal.foods.reduce((sum: number, f: any) => sum + (f.fat || 0), 0),
  }
}

// Ações de refeição
function setMealStatus(mealName: string, status: MealStatus) {
  const meal = mealStates.value.find(m => m.mealName === mealName)
  if (meal) {
    meal.status = status
    handleSave() // Auto-save ao mudar status
  }
}

function toggleExpand(mealName: string) {
  expandedMeal.value = expandedMeal.value === mealName ? null : mealName
}

// Exercício extra
const showExerciseForm = ref(false)
const extraExercise = ref({
  exerciseName: '',
  category: '',
  met: 0,
  durationMinutes: 30,
  intensity: 'MODERATE',
})

function selectExercise(exercise: { name: string; category: string; met: number }) {
  extraExercise.value.exerciseName = exercise.name
  extraExercise.value.category = exercise.category
  extraExercise.value.met = exercise.met
}

async function addExerciseAndSave() {
  if (!extraExercise.value.exerciseName) return
  showExerciseForm.value = false

  // Inclui o exercício extra no save
  await handleSave([{
    exerciseName: extraExercise.value.exerciseName,
    category: extraExercise.value.category,
    met: extraExercise.value.met,
    durationMinutes: extraExercise.value.durationMinutes,
    intensity: extraExercise.value.intensity,
    isExtra: true,
  }])

  // Reset form
  extraExercise.value = { exerciseName: '', category: '', met: 0, durationMinutes: 30, intensity: 'MODERATE' }
}

// Salvar check-in
async function handleSave(extraExercises?: Array<{
  exerciseName: string; category: string; met: number;
  durationMinutes: number; intensity: string; isExtra: boolean;
}>) {
  if (!activeDiet.value) return

  saving.value = true
  saved.value = false

  // Merge exercícios existentes com novos
  const existingExercises = checkinStore.todayCheckIn?.exercises || []
  const exercises = [...existingExercises.map(e => ({
    exerciseName: e.exerciseName,
    category: e.category,
    met: 0, // não temos o MET no check-in salvo, mas o backend recalcula
    durationMinutes: e.durationMinutes,
    intensity: 'MODERATE',
    isExtra: e.isExtra,
  })), ...(extraExercises || [])]

  try {
    await checkinStore.submitCheckIn(
      activeDiet.value._id,
      mealStates.value.map(m => ({
        mealName: m.mealName,
        status: m.status,
        ...(m.notes ? { notes: m.notes } : {}),
      })),
      exercises.length > 0 ? exercises : undefined,
    )
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch {
    // erro já está no checkinStore.error
  } finally {
    saving.value = false
  }
}

// ====================================================
// EDIÇÃO DE REFEIÇÃO — MealEditModal (por dia)
// ====================================================
// A edição substitui todos os foods de uma refeição no check-in,
// NÃO altera a dieta base. As outras refeições se adaptam.
const showEditModal = ref(false)
const editTarget = ref<{ mealIndex: number; meal: any } | null>(null)

function openEditModal(mealIndex: number, mealName: string) {
  // Pega a versão mais recente: adaptada (se disponível) ou original da dieta
  const adapted = getAdaptedMeal(mealName)
  const original = activeDiet.value?.meals[mealIndex]
  const meal = adapted || original
  if (!meal) return

  editTarget.value = { mealIndex, meal }
  showEditModal.value = true
}

function onMealEditSaved() {
  // As adapted meals e summary já foram atualizadas pelo store
  // Mostra feedback visual
  saved.value = true
  setTimeout(() => { saved.value = false }, 3000)
}

// Verifica se uma refeição tem mealOverride (foi editada pelo usuário)
function isMealEdited(mealIndex: number): boolean {
  const checkIn = checkinStore.todayCheckIn as any
  if (!checkIn?.mealOverrides) return false
  return checkIn.mealOverrides.some((o: any) => o.mealIndex === mealIndex)
}

// ====================================================
// TROCA DE ALIMENTOS — Check-in swap (por dia)
// ====================================================
// A troca no check-in salva um override no documento do check-in,
// NÃO altera a dieta base. No dia seguinte, volta ao original.
const showSwapModal = ref(false)
const swapTarget = ref<{ mealIndex: number; foodIndex: number; name: string; calories: number } | null>(null)

// Controla qual alimento acabou de ser trocado (para animação)
const swappedCell = ref<{ mealIndex: number; foodIndex: number } | null>(null)

function openSwapModal(mealIndex: number, foodIndex: number, foodName: string, calories: number) {
  swapTarget.value = { mealIndex, foodIndex, name: foodName, calories }
  showSwapModal.value = true
}

async function handleSwap(newFoodId: string) {
  if (!swapTarget.value || !activeDiet.value) return

  const { mealIndex, foodIndex } = swapTarget.value

  // Busca o alimento selecionado para update otimista
  const selectedFood = foodStore.foods.find(f => f._id === newFoodId)

  // Salva estado anterior para rollback
  const oldAdaptedMeals = JSON.parse(JSON.stringify(checkinStore.adaptedMeals))

  // Update otimista: atualiza adapted meals localmente
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
      originalQuantity: `${equivalentGrams}g`,
      originalCalories: Math.round(selectedFood.caloriesPer100g * factor),
    }

    const mealName = mealStates.value[mealIndex]?.mealName
    const adaptedIdx = checkinStore.adaptedMeals.findIndex(m => m.name === mealName)

    if (adaptedIdx !== -1) {
      const adapted = checkinStore.adaptedMeals[adaptedIdx]
      adapted.foods[foodIndex] = optimisticFood
      adapted.totalCalories = adapted.foods.reduce((sum, f) => sum + f.calories, 0)
      adapted.totalProtein = adapted.foods.reduce((sum, f) => sum + f.protein, 0)
      adapted.totalCarbs = adapted.foods.reduce((sum, f) => sum + f.carbs, 0)
      adapted.totalFat = adapted.foods.reduce((sum, f) => sum + f.fat, 0)
    }
  }

  // Animação
  swappedCell.value = { mealIndex, foodIndex }
  setTimeout(() => { swappedCell.value = null }, 700)

  // Fecha modal
  showSwapModal.value = false
  swapTarget.value = null

  // Sincroniza com backend (check-in swap — não altera a dieta base)
  try {
    await checkinStore.swapFoodInCheckIn(
      activeDiet.value._id,
      mealIndex,
      foodIndex,
      newFoodId,
    )
  } catch {
    // Rollback adapted meals
    checkinStore.adaptedMeals.splice(0, checkinStore.adaptedMeals.length, ...oldAdaptedMeals)
  }
}

// Calcula gramas equivalentes para preview (mesma fórmula do backend)
function previewEquivalentGrams(targetCalories: number, caloriesPer100g: number): number {
  if (caloriesPer100g === 0) return 100
  const rawGrams = (targetCalories / caloriesPer100g) * 100
  const rounded = Math.round(rawGrams / 5) * 5
  return Math.max(5, rounded)
}

// Helpers de formatação
function formatMacro(value: number): string {
  return Math.round(value).toLocaleString('pt-BR')
}

function scalePercent(factor: number): string {
  const pct = Math.round((factor - 1) * 100)
  if (pct > 0) return `+${pct}%`
  if (pct < 0) return `${pct}%`
  return ''
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/dashboard" class="text-zinc-500 hover:text-emerald-600 text-sm">
        ← Voltar
      </NuxtLink>
      <h1 class="text-xl font-bold text-emerald-600">Check-in do Dia</h1>
    </div>

    <!-- Sem dieta -->
    <UCard v-if="!activeDiet" class="text-center">
      <p class="text-zinc-500 mb-4">Você ainda não tem uma dieta gerada.</p>
      <UButton to="/dashboard" color="primary">Gerar Dieta</UButton>
    </UCard>

    <!-- Com dieta -->
    <template v-else>
      <!-- Info da dieta + barra de progresso -->
      <UCard class="mb-4">
        <div class="mb-3">
          <h2 class="font-semibold text-zinc-800">{{ activeDiet.title }}</h2>
          <p class="text-sm text-zinc-500">Marque cada refeição: Comi, Pulei ou Editar</p>
        </div>

        <!-- Barra de progresso -->
        <div class="relative bg-zinc-200 rounded-lg h-8 overflow-hidden">
          <div
            class="h-full bg-emerald-500 rounded-lg transition-all duration-300"
            :style="{ width: `${adherencePercent}%` }"
          ></div>
          <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-zinc-700">
            {{ completedCount }} comidas · {{ skippedCount }} puladas · {{ adherencePercent }}% aderência
          </span>
        </div>
      </UCard>

      <!-- Resumo de macros (aparece quando há dados adaptados) -->
      <UCard v-if="checkinStore.summary" class="mb-4">
        <div class="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p class="text-zinc-500">Consumido</p>
            <p class="text-lg font-bold text-emerald-600">{{ formatMacro(checkinStore.summary.consumed.calories) }}</p>
            <p class="text-xs text-zinc-400">kcal</p>
          </div>
          <div>
            <p class="text-zinc-500">Restante</p>
            <p class="text-lg font-bold text-amber-600">{{ formatMacro(checkinStore.summary.remaining.calories) }}</p>
            <p class="text-xs text-zinc-400">kcal</p>
          </div>
          <div>
            <p class="text-zinc-500">Meta do dia</p>
            <p class="text-lg font-bold text-zinc-800">{{ formatMacro(checkinStore.summary.dailyTarget.calories) }}</p>
            <p class="text-xs text-zinc-400">
              kcal
              <span v-if="checkinStore.summary.exerciseBonus > 0" class="text-emerald-500">
                (+{{ formatMacro(checkinStore.summary.exerciseBonus) }} exercício)
              </span>
            </p>
          </div>
        </div>
        <!-- Macros detalhados -->
        <div class="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-zinc-100 text-center text-xs">
          <div>
            <span class="text-zinc-400">P: {{ formatMacro(checkinStore.summary.consumed.protein) }}g</span>
            <span class="mx-1 text-zinc-300">·</span>
            <span class="text-zinc-400">C: {{ formatMacro(checkinStore.summary.consumed.carbs) }}g</span>
            <span class="mx-1 text-zinc-300">·</span>
            <span class="text-zinc-400">G: {{ formatMacro(checkinStore.summary.consumed.fat) }}g</span>
          </div>
          <div>
            <span class="text-zinc-400">P: {{ formatMacro(checkinStore.summary.remaining.protein) }}g</span>
            <span class="mx-1 text-zinc-300">·</span>
            <span class="text-zinc-400">C: {{ formatMacro(checkinStore.summary.remaining.carbs) }}g</span>
            <span class="mx-1 text-zinc-300">·</span>
            <span class="text-zinc-400">G: {{ formatMacro(checkinStore.summary.remaining.fat) }}g</span>
          </div>
          <div>
            <span class="text-zinc-400">P: {{ formatMacro(checkinStore.summary.dailyTarget.protein) }}g</span>
            <span class="mx-1 text-zinc-300">·</span>
            <span class="text-zinc-400">C: {{ formatMacro(checkinStore.summary.dailyTarget.carbs) }}g</span>
            <span class="mx-1 text-zinc-300">·</span>
            <span class="text-zinc-400">G: {{ formatMacro(checkinStore.summary.dailyTarget.fat) }}g</span>
          </div>
        </div>
      </UCard>

      <!-- Lista de refeições -->
      <div class="space-y-3 mb-4">
        <UCard
          v-for="(meal, index) in mealStates"
          :key="meal.mealName"
          :class="{
            'border-emerald-400': meal.status === 'completed',
            'border-zinc-300 opacity-60': meal.status === 'skipped',
          }"
          class="transition-all"
        >
          <!-- Header da refeição -->
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-zinc-800">{{ meal.mealName }}</span>
                <!-- Badge de edição (refeição editada manualmente) -->
                <UBadge
                  v-if="isMealEdited(index)"
                  color="info"
                  variant="subtle"
                  size="xs"
                  :title="`Original: ${activeDiet.meals[index]?.totalCalories} kcal → Editado: ${getMealMacros(meal.mealName, index).totalCalories} kcal`"
                >
                  Editado
                </UBadge>
                <!-- Badge de adaptação -->
                <UBadge
                  v-else-if="getAdaptedMeal(meal.mealName)?.adapted"
                  color="amber"
                  variant="subtle"
                  size="xs"
                >
                  Adaptado {{ scalePercent(getAdaptedMeal(meal.mealName)?.scaleFactor ?? 1) }}
                </UBadge>
                <UBadge v-if="meal.status === 'skipped'" color="zinc" variant="subtle" size="xs">
                  Pulada
                </UBadge>
              </div>
              <p class="text-sm text-zinc-500">
                {{ activeDiet.meals[index]?.time }}
                ·
                <template v-if="getAdaptedMeal(meal.mealName)?.adapted">
                  <span class="line-through text-zinc-400">{{ activeDiet.meals[index]?.totalCalories }}</span>
                  <span class="font-semibold text-amber-600">
                    {{ formatMacro(getAdaptedMeal(meal.mealName)?.totalCalories ?? 0) }}
                  </span>
                </template>
                <template v-else-if="meal.status === 'skipped'">
                  <span class="line-through">{{ activeDiet.meals[index]?.totalCalories }}</span>
                  <span>0</span>
                </template>
                <template v-else>
                  {{ activeDiet.meals[index]?.totalCalories }}
                </template>
                kcal
                <!-- Macros por refeição -->
                <span class="text-zinc-400 text-xs ml-1">
                  P:{{ formatMacro(getMealMacros(meal.mealName, index).totalProtein) }}g
                  C:{{ formatMacro(getMealMacros(meal.mealName, index).totalCarbs) }}g
                  G:{{ formatMacro(getMealMacros(meal.mealName, index).totalFat) }}g
                </span>
              </p>
            </div>

            <!-- Botões de ação: Comi / Pulei / Editar -->
            <div class="flex gap-1">
              <UButton
                :color="meal.status === 'completed' ? 'primary' : 'neutral'"
                :variant="meal.status === 'completed' ? 'solid' : 'outline'"
                size="xs"
                @click="setMealStatus(meal.mealName, meal.status === 'completed' ? 'pending' : 'completed')"
              >
                Comi
              </UButton>
              <UButton
                :color="meal.status === 'skipped' ? 'error' : 'neutral'"
                :variant="meal.status === 'skipped' ? 'solid' : 'outline'"
                size="xs"
                @click="setMealStatus(meal.mealName, meal.status === 'skipped' ? 'pending' : 'skipped')"
              >
                Pulei
              </UButton>
              <UButton
                :color="isMealEdited(index) ? 'info' : 'neutral'"
                :variant="isMealEdited(index) ? 'solid' : 'outline'"
                size="xs"
                @click="openEditModal(index, meal.mealName)"
              >
                &#9998; Editar
              </UButton>
            </div>
          </div>

          <!-- Alimentos (sempre visível) -->
          <div class="mt-3 pt-3 border-t border-zinc-100">
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
                  v-for="(food, fIdx) in (getAdaptedMeal(meal.mealName)?.foods || activeDiet.meals[index]?.foods || [])"
                  :key="`${index}-${fIdx}`"
                  class="text-zinc-700 group"
                  :class="{ 'swap-flash': swappedCell?.mealIndex === index && swappedCell?.foodIndex === fIdx }"
                >
                  <td class="py-0.5">{{ food.name }}</td>
                  <td class="text-right py-0.5">
                    <template v-if="food.originalQuantity && food.quantity !== food.originalQuantity">
                      <span class="line-through text-zinc-400 text-xs mr-1">{{ food.originalQuantity }}</span>
                      <span class="text-amber-600 font-medium">{{ food.quantity }}</span>
                    </template>
                    <template v-else>{{ food.quantity }}</template>
                  </td>
                  <td class="text-right py-0.5">{{ Math.round(food.calories) }}</td>
                  <td class="text-right py-0.5 text-zinc-400">{{ Math.round(food.protein) }}</td>
                  <td class="text-right py-0.5 text-zinc-400">{{ Math.round(food.carbs) }}</td>
                  <td class="text-right py-0.5 text-zinc-400">{{ Math.round(food.fat) }}</td>
                  <td class="text-right py-0.5">
                    <button
                      class="text-zinc-300 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Trocar alimento"
                      @click="openSwapModal(index, fIdx, food.name, food.calories)"
                    >
                      &#8644;
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Notas (expand para mostrar) -->
            <div
              class="mt-2 cursor-pointer text-xs text-zinc-400 hover:text-zinc-600"
              @click="toggleExpand(meal.mealName)"
            >
              {{ expandedMeal === meal.mealName ? '▲ Esconder notas' : '▼ Adicionar nota' }}
            </div>
            <UInput
              v-if="expandedMeal === meal.mealName"
              v-model="meal.notes"
              placeholder="Notas (opcional)"
              class="mt-1"
              size="sm"
            />
          </div>
        </UCard>
      </div>

      <!-- Seção de exercício extra -->
      <UCard class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-zinc-800">Exercício Extra</h3>
          <UButton
            v-if="!showExerciseForm"
            size="xs"
            variant="outline"
            @click="showExerciseForm = true"
          >
            + Adicionar
          </UButton>
        </div>

        <!-- Exercícios já registrados hoje -->
        <div v-if="checkinStore.todayCheckIn?.exercises?.length" class="space-y-1 mb-3">
          <div
            v-for="ex in checkinStore.todayCheckIn.exercises.filter(e => e.isExtra)"
            :key="ex.exerciseName"
            class="flex justify-between text-sm text-zinc-600"
          >
            <span>{{ ex.exerciseName }} ({{ ex.durationMinutes }}min)</span>
            <span class="text-emerald-600 font-medium">+{{ Math.round(ex.caloriesBurned) }} kcal</span>
          </div>
        </div>

        <!-- Formulário de exercício extra -->
        <div v-if="showExerciseForm" class="space-y-2">
          <!-- Busca de exercícios -->
          <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-zinc-200 rounded-lg p-2">
            <button
              v-for="ex in exerciseStore.exercises.slice(0, 20)"
              :key="ex.name"
              class="text-left text-xs px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
              :class="extraExercise.exerciseName === ex.name ? 'bg-emerald-100 font-medium' : 'bg-zinc-50'"
              @click="selectExercise(ex)"
            >
              {{ ex.name }}
            </button>
          </div>

          <div v-if="extraExercise.exerciseName" class="flex gap-2 items-end">
            <UFormField label="Duração (min)" class="flex-1">
              <UInput v-model.number="extraExercise.durationMinutes" type="number" size="sm" />
            </UFormField>
            <UFormField label="Intensidade" class="flex-1">
              <USelect
                v-model="extraExercise.intensity"
                :items="[
                  { label: 'Leve', value: 'LIGHT' },
                  { label: 'Moderada', value: 'MODERATE' },
                  { label: 'Intensa', value: 'INTENSE' },
                ]"
                size="sm"
              />
            </UFormField>
            <UButton color="primary" size="sm" @click="addExerciseAndSave">
              Salvar
            </UButton>
          </div>

          <UButton v-if="showExerciseForm" variant="ghost" size="xs" @click="showExerciseForm = false">
            Cancelar
          </UButton>
        </div>

        <p v-if="!checkinStore.todayCheckIn?.exercises?.length && !showExerciseForm" class="text-sm text-zinc-400">
          Fez exercício extra hoje? Registre aqui para adaptar suas refeições.
        </p>
      </UCard>

      <!-- Mensagens -->
      <UAlert v-if="checkinStore.error" color="error" :description="checkinStore.error" class="mb-3" />
      <UAlert v-if="saved" color="success" description="Check-in salvo com sucesso!" class="mb-3" />

      <!-- Botão salvar manual -->
      <UButton
        block
        color="primary"
        size="lg"
        :loading="saving"
        @click="handleSave()"
      >
        {{ saving ? 'Salvando...' : 'Salvar Check-in' }}
      </UButton>

      <!-- Modal de troca de alimento (check-in = troca por dia, não altera a dieta base) -->
      <FoodSwapModal
        :open="showSwapModal"
        :target-food="swapTarget"
        @update:open="showSwapModal = $event"
        @swap="handleSwap"
      />

      <!-- Modal de edição de refeição (edita todos os foods de uma refeição) -->
      <MealEditModal
        :open="showEditModal"
        :meal="editTarget?.meal || null"
        :meal-index="editTarget?.mealIndex ?? 0"
        :diet-id="activeDiet._id"
        @update:open="showEditModal = $event"
        @saved="onMealEditSaved"
      />
    </template>
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
