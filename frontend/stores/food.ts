import { ref } from 'vue'
import { defineStore } from 'pinia'

// ====================================================
// FOOD STORE
// ====================================================
// Gerencia a base de alimentos (TACO) e troca de alimentos
// na dieta do usuário.
//
// - foods: resultados da busca na base nutricional
// - suggestions: alimentos similares para substituição
// - swapFood: executa a troca na dieta com equivalência calórica

export type FoodItem = {
  _id: string
  name: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  commonPortions: Array<{ name: string; grams: number }>
}

export const useFoodStore = defineStore('food', () => {
  const foods = ref<FoodItem[]>([])
  const suggestions = ref<FoodItem[]>([])
  const loading = ref(false)
  const error = ref('')

  // Busca alimentos na base (com filtros opcionais)
  async function fetchFoods(params?: { search?: string; category?: string }) {
    const { api } = useApi()
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)

    const queryStr = query.toString()
    const url = queryStr ? `/foods?${queryStr}` : '/foods'

    foods.value = await api<FoodItem[]>(url)
  }

  // Busca sugestões de substituição para um alimento
  async function fetchSuggestions(foodId: string) {
    const { api } = useApi()
    suggestions.value = await api<FoodItem[]>(`/foods/${foodId}/suggestions`)
  }

  // Executa a troca de alimento na dieta
  async function swapFood(dietId: string, mealIndex: number, foodIndex: number, newFoodId: string) {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const result = await api(`/diets/${dietId}/meals/${mealIndex}/foods/${foodIndex}/swap`, {
        method: 'PATCH',
        body: { newFoodId },
      })
      return result
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao trocar alimento'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    foods,
    suggestions,
    loading,
    error,
    fetchFoods,
    fetchSuggestions,
    swapFood,
  }
})
