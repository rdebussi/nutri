import { ref } from 'vue'
import { defineStore } from 'pinia'

// ====================================================
// EXERCISE STORE
// ====================================================
// Gerencia exercícios e rotina semanal do usuário.
//
// - exercises: base de exercícios disponíveis (MongoDB)
// - routines: rotina semanal do usuário (PostgreSQL)
// - tdee: gasto calórico diário calculado
//
// O fluxo é:
// 1. Usuário busca exercícios na base (GET /exercises)
// 2. Monta sua rotina semanal (PUT /users/me/routines)
// 3. Sistema calcula o TDEE (GET /users/me/tdee)

export type Exercise = {
  _id: string
  name: string
  category: 'strength' | 'cardio' | 'sports' | 'flexibility' | 'daily'
  met: number
}

export type ExerciseRoutine = {
  id: string
  exerciseName: string
  category: string
  met: number
  daysPerWeek: number
  durationMinutes: number
  intensity: 'LIGHT' | 'MODERATE' | 'INTENSE'
}

export type TDEEData = {
  bmr: number
  tdee: number
  adjustedTdee: number
  goal: string
  age: number
  routines: number
}

export const useExerciseStore = defineStore('exercise', () => {
  const exercises = ref<Exercise[]>([])
  const routines = ref<ExerciseRoutine[]>([])
  const tdee = ref<TDEEData | null>(null)
  const loading = ref(false)
  const error = ref('')

  // Busca exercícios da base (com filtro opcional)
  async function fetchExercises(params?: { search?: string; category?: string }) {
    const { api } = useApi()
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)

    const queryStr = query.toString()
    const url = queryStr ? `/exercises?${queryStr}` : '/exercises'

    exercises.value = await api<Exercise[]>(url)
  }

  // Busca rotina semanal do usuário
  async function fetchRoutines() {
    const { api } = useApi()
    routines.value = await api<ExerciseRoutine[]>('/users/me/routines')
  }

  // Salva/substitui toda a rotina semanal
  async function saveRoutines(
    newRoutines: Array<{
      exerciseName: string
      category: string
      met: number
      daysPerWeek: number
      durationMinutes: number
      intensity: string
    }>,
  ) {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      routines.value = await api<ExerciseRoutine[]>('/users/me/routines', {
        method: 'PUT',
        body: { routines: newRoutines },
      })
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao salvar rotina'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Busca o TDEE calculado
  async function fetchTDEE() {
    try {
      const { api } = useApi()
      tdee.value = await api<TDEEData>('/users/me/tdee')
    } catch {
      // TDEE pode falhar se o perfil está incompleto — silencia o erro
      tdee.value = null
    }
  }

  return {
    exercises,
    routines,
    tdee,
    loading,
    error,
    fetchExercises,
    fetchRoutines,
    saveRoutines,
    fetchTDEE,
  }
})
