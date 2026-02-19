import { ref } from 'vue'
import { defineStore } from 'pinia'

// ====================================================
// FOOD STORE
// ====================================================
// Gerencia a base de alimentos (TACO), alimentos customizados,
// favoritos e troca de alimentos na dieta do usuário.
//
// - foods: resultados da busca na base nutricional
// - suggestions: alimentos similares para substituição
// - customFoods: alimentos criados pelo usuário
// - favorites: alimentos marcados como favoritos
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
  source?: 'database' | 'custom'
  isFavorite?: boolean
}

export type CustomFoodItem = {
  _id: string
  userId: string
  name: string
  category: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  servingSize?: number
  servingName?: string
  ingredients?: string
  createdAt: string
  updatedAt: string
}

export type CreateCustomFoodInput = {
  name: string
  category: string
  ingredients?: string
  // Por 100g
  caloriesPer100g?: number
  proteinPer100g?: number
  carbsPer100g?: number
  fatPer100g?: number
  // Por porção
  servingSize?: number
  servingName?: string
  caloriesPerServing?: number
  proteinPerServing?: number
  carbsPerServing?: number
  fatPerServing?: number
}

export type FavoriteItem = {
  _id: string
  foodId: string
  foodSource: 'database' | 'custom'
  food: FoodItem | CustomFoodItem
  createdAt: string
}

export const useFoodStore = defineStore('food', () => {
  const foods = ref<FoodItem[]>([])
  const suggestions = ref<FoodItem[]>([])
  const customFoods = ref<CustomFoodItem[]>([])
  const favorites = ref<FavoriteItem[]>([])
  const loading = ref(false)
  const error = ref('')

  // ====================================================
  // BUSCA DE ALIMENTOS (base nutricional)
  // ====================================================

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

  // Busca unificada: database + custom + favoritos marcados
  async function fetchFoodsUnified(params?: { search?: string; category?: string }) {
    const { api } = useApi()
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)
    query.set('include', 'custom,favorites')

    foods.value = await api<FoodItem[]>(`/foods?${query.toString()}`)
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

  // ====================================================
  // ALIMENTOS CUSTOMIZADOS
  // ====================================================

  async function fetchCustomFoods(params?: { search?: string; category?: string }) {
    const { api } = useApi()
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.category) query.set('category', params.category)

    const queryStr = query.toString()
    const url = queryStr ? `/foods/custom?${queryStr}` : '/foods/custom'

    customFoods.value = await api<CustomFoodItem[]>(url)
  }

  async function createCustomFood(data: CreateCustomFoodInput) {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const created = await api<CustomFoodItem>('/foods/custom', {
        method: 'POST',
        body: data,
      })
      customFoods.value.push(created)
      return created
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao criar alimento'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCustomFood(id: string, data: Partial<CreateCustomFoodInput>) {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const updated = await api<CustomFoodItem>(`/foods/custom/${id}`, {
        method: 'PUT',
        body: data,
      })
      const idx = customFoods.value.findIndex(f => f._id === id)
      if (idx !== -1) customFoods.value[idx] = updated
      return updated
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao atualizar alimento'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCustomFood(id: string) {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      await api(`/foods/custom/${id}`, { method: 'DELETE' })
      customFoods.value = customFoods.value.filter(f => f._id !== id)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao excluir alimento'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ====================================================
  // FAVORITOS
  // ====================================================

  async function fetchFavorites() {
    const { api } = useApi()
    favorites.value = await api<FavoriteItem[]>('/foods/favorites')
  }

  async function toggleFavorite(foodId: string, foodSource: 'database' | 'custom') {
    loading.value = true
    error.value = ''

    try {
      const { api } = useApi()
      const result = await api<{ action: 'added' | 'removed' }>('/foods/favorites', {
        method: 'POST',
        body: { foodId, foodSource },
      })

      // Atualiza isFavorite nos foods da busca
      const food = foods.value.find(f => f._id === foodId)
      if (food) food.isFavorite = result.action === 'added'

      // Remove dos favoritos locais se removeu
      if (result.action === 'removed') {
        favorites.value = favorites.value.filter(f => f.foodId !== foodId)
      }

      return result
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Erro ao favoritar alimento'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    foods,
    suggestions,
    customFoods,
    favorites,
    loading,
    error,
    fetchFoods,
    fetchFoodsUnified,
    fetchSuggestions,
    swapFood,
    fetchCustomFoods,
    createCustomFood,
    updateCustomFood,
    deleteCustomFood,
    fetchFavorites,
    toggleFavorite,
  }
})
