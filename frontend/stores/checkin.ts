import { ref } from 'vue'
import { defineStore } from 'pinia'

// ====================================================
// CHECK-IN STORE
// ====================================================
// Gerencia o estado dos check-ins diários no frontend.
// O check-in registra quais refeições o usuário comeu/não comeu.
//
// Estado principal:
// - todayCheckIn: check-in de hoje (ou null se ainda não fez)
// - weeklyStats: estatísticas dos últimos 7 dias
// - streak: dias consecutivos de aderência

export type MealCheckIn = {
  mealName: string
  completed: boolean
  completedAt?: string
  notes?: string
}

export type CheckIn = {
  _id: string
  userId: string
  dietId: string
  date: string
  meals: MealCheckIn[]
  adherenceRate: number
  createdAt: string
  updatedAt: string
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
  const weeklyStats = ref<WeeklyStatsData | null>(null)
  const streak = ref(0)
  const loading = ref(false)
  const error = ref('')

  async function submitCheckIn(dietId: string, meals: Array<{ mealName: string; completed: boolean; notes?: string }>) {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const checkIn = await api<CheckIn>('/check-ins', {
        method: 'POST',
        body: { dietId, meals },
      })
      todayCheckIn.value = checkIn
      return checkIn
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao salvar check-in'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchToday() {
    const { api } = useApi()
    todayCheckIn.value = await api<CheckIn | null>('/check-ins')
  }

  async function fetchWeeklyStats() {
    const { api } = useApi()
    const stats = await api<WeeklyStatsData>('/check-ins/stats')
    weeklyStats.value = stats
    streak.value = stats.streak
  }

  return { todayCheckIn, weeklyStats, streak, loading, error, submitCheckIn, fetchToday, fetchWeeklyStats }
})
