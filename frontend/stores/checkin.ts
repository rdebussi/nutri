import { ref } from 'vue'
import { defineStore } from 'pinia'

// ====================================================
// CHECK-IN STORE — Fase 3.3
// ====================================================
// Gerencia o estado dos check-ins diários no frontend.
//
// FASE 3.3: Refeições Adaptativas
// - Meals agora usam status ('pending'|'completed'|'skipped')
// - API retorna adaptedMeals e summary junto com o check-in
// - Store mantém as refeições adaptadas para exibição

export type MealStatus = 'pending' | 'completed' | 'skipped'

export type MealCheckIn = {
  mealName: string
  status: MealStatus
  completedAt?: string
  skippedAt?: string
  notes?: string
}

export type CheckIn = {
  _id: string
  userId: string
  dietId: string
  date: string
  meals: MealCheckIn[]
  exercises?: Array<{
    exerciseName: string
    category: string
    durationMinutes: number
    caloriesBurned: number
    isExtra: boolean
  }>
  adherenceRate: number
  totalCaloriesBurned: number
  createdAt: string
  updatedAt: string
}

export type MacroSummary = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type AdaptedFood = {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  originalQuantity: string
  originalCalories: number
}

export type AdaptedMeal = {
  name: string
  time: string
  adapted: boolean
  scaleFactor: number
  foods: AdaptedFood[]
  totalCalories: number
  originalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export type AdaptationSummary = {
  consumed: MacroSummary
  remaining: MacroSummary
  dailyTarget: MacroSummary
  exerciseBonus: number
}

export type CheckInResponse = {
  checkIn: CheckIn
  adaptedMeals: AdaptedMeal[]
  summary: AdaptationSummary
}

export type WeeklyDayStat = {
  date: string
  adherenceRate: number
  mealsCompleted: number
  mealsTotal: number
}

export type WeeklyStatsData = {
  weeklyStats: WeeklyDayStat[]
  streak: number
  averageAdherence: number
}

export const useCheckinStore = defineStore('checkin', () => {
  const todayCheckIn = ref<CheckIn | null>(null)
  const adaptedMeals = ref<AdaptedMeal[]>([])
  const summary = ref<AdaptationSummary | null>(null)
  const weeklyStats = ref<WeeklyStatsData | null>(null)
  const streak = ref(0)
  const loading = ref(false)
  const error = ref('')

  async function submitCheckIn(
    dietId: string,
    meals: Array<{ mealName: string; status: MealStatus; notes?: string }>,
    exercises?: Array<{
      exerciseName: string
      category: string
      met: number
      durationMinutes: number
      intensity?: string
      isExtra?: boolean
    }>,
  ) {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const result = await api<CheckInResponse>('/check-ins', {
        method: 'POST',
        body: { dietId, meals, ...(exercises?.length ? { exercises } : {}) },
      })
      todayCheckIn.value = result.checkIn
      adaptedMeals.value = result.adaptedMeals
      summary.value = result.summary
      return result
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao salvar check-in'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchToday() {
    const { api } = useApi()
    const result = await api<CheckInResponse | null>('/check-ins')
    if (result) {
      todayCheckIn.value = result.checkIn
      adaptedMeals.value = result.adaptedMeals
      summary.value = result.summary
    } else {
      todayCheckIn.value = null
      adaptedMeals.value = []
      summary.value = null
    }
  }

  async function fetchWeeklyStats() {
    const { api } = useApi()
    const stats = await api<WeeklyStatsData>('/check-ins/stats')
    weeklyStats.value = stats
    streak.value = stats.streak
  }

  // Troca alimento no check-in (por dia, não altera a dieta base)
  async function swapFoodInCheckIn(
    dietId: string,
    mealIndex: number,
    foodIndex: number,
    newFoodId: string,
    date?: string,
  ) {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const result = await api<CheckInResponse>('/check-ins/foods/swap', {
        method: 'PATCH',
        body: { dietId, mealIndex, foodIndex, newFoodId, ...(date ? { date } : {}) },
      })
      todayCheckIn.value = result.checkIn
      adaptedMeals.value = result.adaptedMeals
      summary.value = result.summary
      return result
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao trocar alimento'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Edita uma refeição inteira no check-in (não altera a dieta base)
  async function editMealInCheckIn(
    dietId: string,
    mealIndex: number,
    foods: Array<{
      name: string
      quantity: string
      calories: number
      protein: number
      carbs: number
      fat: number
    }>,
    date?: string,
  ) {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const result = await api<CheckInResponse>('/check-ins/meals/edit', {
        method: 'PATCH',
        body: { dietId, mealIndex, foods, ...(date ? { date } : {}) },
      })
      todayCheckIn.value = result.checkIn
      adaptedMeals.value = result.adaptedMeals
      summary.value = result.summary
      return result
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao editar refeição'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    todayCheckIn, adaptedMeals, summary, weeklyStats, streak,
    loading, error,
    submitCheckIn, fetchToday, fetchWeeklyStats, swapFoodInCheckIn, editMealInCheckIn,
  }
})
