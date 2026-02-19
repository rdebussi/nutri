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
  // === Outros ===
  fiber: number         // g
  omega3: number        // g
  cholesterol: number   // mg
  // === Vitaminas ===
  vitaminA: number      // mcg RAE
  vitaminB1: number     // mg
  vitaminB2: number     // mg
  vitaminB3: number     // mg
  vitaminB5: number     // mg
  vitaminB6: number     // mg
  vitaminB9: number     // mcg
  vitaminB12: number    // mcg
  vitaminC: number      // mg
  vitaminD: number      // mcg
  vitaminE: number      // mg
  vitaminK: number      // mcg
  // === Minerais ===
  calcium: number       // mg
  iron: number          // mg
  magnesium: number     // mg
  phosphorus: number    // mg
  potassium: number     // mg
  sodium: number        // mg
  zinc: number          // mg
  copper: number        // mg
  manganese: number     // mg
  selenium: number      // mcg
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
