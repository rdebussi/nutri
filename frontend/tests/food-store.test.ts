import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// Mock Nuxt globals
const mockApi = vi.fn()
vi.stubGlobal('useCookie', () => ref(null))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://localhost:3000/api/v1' } }))
vi.stubGlobal('useApi', () => ({ api: mockApi }))

import { useFoodStore } from '../stores/food'

describe('Food Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty state', () => {
    const store = useFoodStore()
    expect(store.foods).toEqual([])
    expect(store.suggestions).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })

  it('fetchFoods populates foods list', async () => {
    const mockFoods = [
      { _id: '1', name: 'Arroz branco cozido', category: 'grains', caloriesPer100g: 128 },
      { _id: '2', name: 'Frango grelhado', category: 'proteins', caloriesPer100g: 159 },
    ]
    mockApi.mockResolvedValue(mockFoods)

    const store = useFoodStore()
    await store.fetchFoods()

    expect(mockApi).toHaveBeenCalledWith('/foods')
    expect(store.foods).toEqual(mockFoods)
  })

  it('fetchFoods with filters builds correct URL', async () => {
    mockApi.mockResolvedValue([])

    const store = useFoodStore()
    await store.fetchFoods({ search: 'arroz', category: 'grains' })

    expect(mockApi).toHaveBeenCalledWith('/foods?search=arroz&category=grains')
  })

  it('fetchSuggestions populates suggestions for a food', async () => {
    const mockSuggestions = [
      { _id: '3', name: 'Macarrão cozido', category: 'grains', caloriesPer100g: 102 },
      { _id: '4', name: 'Batata doce cozida', category: 'grains', caloriesPer100g: 77 },
    ]
    mockApi.mockResolvedValue(mockSuggestions)

    const store = useFoodStore()
    await store.fetchSuggestions('food-1')

    expect(mockApi).toHaveBeenCalledWith('/foods/food-1/suggestions')
    expect(store.suggestions).toEqual(mockSuggestions)
  })

  it('swapFood calls API and returns updated diet', async () => {
    const updatedDiet = {
      _id: 'diet-1',
      meals: [{ name: 'Café', foods: [{ name: 'Batata doce cozida', quantity: '335g' }] }],
      totalCalories: 650,
    }
    mockApi.mockResolvedValue(updatedDiet)

    const store = useFoodStore()
    const result = await store.swapFood('diet-1', 0, 0, 'food-batata')

    expect(mockApi).toHaveBeenCalledWith('/diets/diet-1/meals/0/foods/0/swap', {
      method: 'PATCH',
      body: { newFoodId: 'food-batata' },
    })
    expect(result).toEqual(updatedDiet)
  })

  it('swapFood sets loading and error states correctly', async () => {
    mockApi.mockRejectedValue(new Error('Alimento não encontrado'))

    const store = useFoodStore()
    await expect(store.swapFood('diet-1', 0, 0, 'bad-id')).rejects.toThrow('Alimento não encontrado')

    expect(store.error).toBe('Alimento não encontrado')
    expect(store.loading).toBe(false)
  })
})
