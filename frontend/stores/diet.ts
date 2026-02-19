import { ref } from 'vue'
import { defineStore } from 'pinia'

// ====================================================
// DIET STORE
// ====================================================
// Gerencia o estado das dietas no frontend.
// Armazena a lista de dietas e a dieta sendo visualizada.
//
// "Generating" é um estado importante: enquanto a IA gera
// a dieta (pode levar 5-15 segundos), precisamos mostrar
// um loading para o usuário não achar que travou.

export type Micronutrients = {
  fiber: number      // g
  calcium: number    // mg
  iron: number       // mg
  sodium: number     // mg
  potassium: number  // mg
  magnesium: number  // mg
  vitaminA: number   // mcg RAE
  vitaminC: number   // mg
}

export type Food = {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  micronutrients?: Micronutrients
}

export type Meal = {
  name: string
  time: string
  foods: Food[]
  totalCalories: number
}

export type Diet = {
  _id: string
  userId: string
  title: string
  meals: Meal[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalMicronutrients?: Micronutrients
  goal: string
  notes: string
  createdAt: string
}

export const useDietStore = defineStore('diet', () => {
  const diets = ref<Diet[]>([])
  const currentDiet = ref<Diet | null>(null)
  const generating = ref(false)
  const error = ref('')

  async function generate() {
    generating.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const diet = await api<Diet>('/diets/generate', { method: 'POST' })
      diets.value.unshift(diet) // adiciona no início da lista
      currentDiet.value = diet
      return diet
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao gerar dieta'
      throw e
    } finally {
      generating.value = false
    }
  }

  async function fetchAll() {
    const { api } = useApi()
    diets.value = await api<Diet[]>('/diets')
  }

  async function fetchById(id: string) {
    const { api } = useApi()
    currentDiet.value = await api<Diet>(`/diets/${id}`)
    return currentDiet.value
  }

  // Regenera uma refeição com IA (mesmas calorias, ingredientes diferentes)
  const refreshing = ref(false)
  const refreshesRemaining = ref<number | null>(null)

  async function refreshMeal(dietId: string, mealIndex: number) {
    refreshing.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const result = await api<{ diet: Diet; refreshesRemaining: number }>(
        `/diets/${dietId}/meals/${mealIndex}/refresh`,
        { method: 'POST' },
      )
      currentDiet.value = result.diet
      refreshesRemaining.value = result.refreshesRemaining

      // Atualiza na lista de dietas também
      const idx = diets.value.findIndex(d => d._id === dietId)
      if (idx !== -1) diets.value[idx] = result.diet

      return result
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao atualizar refeição'
      throw e
    } finally {
      refreshing.value = false
    }
  }

  return {
    diets, currentDiet, generating, refreshing, refreshesRemaining, error,
    generate, fetchAll, fetchById, refreshMeal,
  }
})
