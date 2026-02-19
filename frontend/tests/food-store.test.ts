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

  // ====================================================
  // ALIMENTOS CUSTOMIZADOS
  // ====================================================

  describe('custom foods', () => {
    it('starts with empty customFoods and favorites', () => {
      const store = useFoodStore()
      expect(store.customFoods).toEqual([])
      expect(store.favorites).toEqual([])
    })

    it('fetchCustomFoods populates customFoods list', async () => {
      const mockFoods = [
        { _id: '1', name: 'Panqueca de aveia', category: 'grains', caloriesPer100g: 200 },
        { _id: '2', name: 'Shake proteico', category: 'beverages', caloriesPer100g: 120 },
      ]
      mockApi.mockResolvedValue(mockFoods)

      const store = useFoodStore()
      await store.fetchCustomFoods()

      expect(store.customFoods).toEqual(mockFoods)
      expect(mockApi).toHaveBeenCalledWith('/foods/custom')
    })

    it('fetchCustomFoods with search filter', async () => {
      mockApi.mockResolvedValue([])

      const store = useFoodStore()
      await store.fetchCustomFoods({ search: 'panqueca' })

      expect(mockApi).toHaveBeenCalledWith('/foods/custom?search=panqueca')
    })

    it('fetchCustomFoods with category filter', async () => {
      mockApi.mockResolvedValue([])

      const store = useFoodStore()
      await store.fetchCustomFoods({ category: 'grains' })

      expect(mockApi).toHaveBeenCalledWith('/foods/custom?category=grains')
    })

    it('createCustomFood adds to list and returns created', async () => {
      const created = { _id: '1', name: 'Panqueca de aveia', category: 'grains', caloriesPer100g: 200 }
      mockApi.mockResolvedValue(created)

      const store = useFoodStore()
      const result = await store.createCustomFood({
        name: 'Panqueca de aveia',
        category: 'grains',
        caloriesPer100g: 200,
        proteinPer100g: 8,
        carbsPer100g: 30,
        fatPer100g: 6,
      })

      expect(result).toEqual(created)
      expect(store.customFoods).toHaveLength(1)
      expect(store.customFoods[0].name).toBe('Panqueca de aveia')
      expect(mockApi).toHaveBeenCalledWith('/foods/custom', {
        method: 'POST',
        body: expect.objectContaining({ name: 'Panqueca de aveia' }),
      })
    })

    it('createCustomFood sets error on failure', async () => {
      mockApi.mockRejectedValue(new Error('Validation failed'))

      const store = useFoodStore()

      await expect(store.createCustomFood({
        name: 'X',
        category: 'grains',
        caloriesPer100g: 200,
      })).rejects.toThrow('Validation failed')

      expect(store.error).toBe('Validation failed')
      expect(store.loading).toBe(false)
    })

    it('createCustomFood with per-serving input sends correct body', async () => {
      mockApi.mockResolvedValue({ _id: '1', name: 'Bolo caseiro' })

      const store = useFoodStore()
      await store.createCustomFood({
        name: 'Bolo caseiro',
        category: 'sweets',
        servingSize: 80,
        servingName: '1 fatia',
        caloriesPerServing: 250,
        proteinPerServing: 4,
        carbsPerServing: 35,
        fatPerServing: 12,
      })

      expect(mockApi).toHaveBeenCalledWith('/foods/custom', {
        method: 'POST',
        body: expect.objectContaining({
          servingSize: 80,
          servingName: '1 fatia',
          caloriesPerServing: 250,
        }),
      })
    })

    it('updateCustomFood updates item in list', async () => {
      const store = useFoodStore()
      store.customFoods = [
        { _id: '1', name: 'Panqueca', category: 'grains', caloriesPer100g: 200 } as any,
      ]

      const updated = { _id: '1', name: 'Panqueca de aveia', category: 'grains', caloriesPer100g: 210 }
      mockApi.mockResolvedValue(updated)

      const result = await store.updateCustomFood('1', { name: 'Panqueca de aveia' })

      expect(result).toEqual(updated)
      expect(store.customFoods[0].name).toBe('Panqueca de aveia')
    })

    it('deleteCustomFood removes item from list', async () => {
      const store = useFoodStore()
      store.customFoods = [
        { _id: '1', name: 'Panqueca' } as any,
        { _id: '2', name: 'Shake' } as any,
      ]

      mockApi.mockResolvedValue({})

      await store.deleteCustomFood('1')

      expect(store.customFoods).toHaveLength(1)
      expect(store.customFoods[0]._id).toBe('2')
      expect(mockApi).toHaveBeenCalledWith('/foods/custom/1', { method: 'DELETE' })
    })
  })

  // ====================================================
  // FAVORITOS
  // ====================================================

  describe('favorites', () => {
    it('fetchFavorites populates favorites list', async () => {
      const mockFavorites = [
        { _id: 'fav1', foodId: 'f1', foodSource: 'database', food: { name: 'Arroz' } },
      ]
      mockApi.mockResolvedValue(mockFavorites)

      const store = useFoodStore()
      await store.fetchFavorites()

      expect(store.favorites).toEqual(mockFavorites)
      expect(mockApi).toHaveBeenCalledWith('/foods/favorites')
    })

    it('toggleFavorite (add) updates isFavorite in foods', async () => {
      mockApi.mockResolvedValue({ action: 'added' })

      const store = useFoodStore()
      store.foods = [
        { _id: 'f1', name: 'Arroz', isFavorite: false } as any,
      ]

      const result = await store.toggleFavorite('f1', 'database')

      expect(result.action).toBe('added')
      expect(store.foods[0].isFavorite).toBe(true)
      expect(mockApi).toHaveBeenCalledWith('/foods/favorites', {
        method: 'POST',
        body: { foodId: 'f1', foodSource: 'database' },
      })
    })

    it('toggleFavorite (remove) updates local state', async () => {
      mockApi.mockResolvedValue({ action: 'removed' })

      const store = useFoodStore()
      store.foods = [
        { _id: 'f1', name: 'Arroz', isFavorite: true } as any,
      ]
      store.favorites = [
        { _id: 'fav1', foodId: 'f1', foodSource: 'database' } as any,
      ]

      await store.toggleFavorite('f1', 'database')

      expect(store.foods[0].isFavorite).toBe(false)
      expect(store.favorites).toHaveLength(0)
    })

    it('toggleFavorite sets error on failure', async () => {
      mockApi.mockRejectedValue(new Error('Network error'))

      const store = useFoodStore()
      await expect(store.toggleFavorite('f1', 'database')).rejects.toThrow('Network error')

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })
  })

  // ====================================================
  // BUSCA UNIFICADA
  // ====================================================

  describe('fetchFoodsUnified', () => {
    it('includes custom and favorites in query', async () => {
      const mockFoods = [
        { _id: '1', name: 'Arroz', source: 'database', isFavorite: true },
        { _id: '2', name: 'Panqueca', source: 'custom', isFavorite: false },
      ]
      mockApi.mockResolvedValue(mockFoods)

      const store = useFoodStore()
      await store.fetchFoodsUnified({ search: 'ar' })

      expect(store.foods).toEqual(mockFoods)
      const calledUrl = mockApi.mock.calls[0][0] as string
      expect(calledUrl).toContain('include=custom%2Cfavorites')
      expect(calledUrl).toContain('search=ar')
    })

    it('works without search filters', async () => {
      mockApi.mockResolvedValue([])

      const store = useFoodStore()
      await store.fetchFoodsUnified()

      const calledUrl = mockApi.mock.calls[0][0] as string
      expect(calledUrl).toContain('include=custom%2Cfavorites')
    })
  })
})
