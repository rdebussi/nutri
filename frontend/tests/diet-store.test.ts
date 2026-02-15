import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// Mock Nuxt globals
const mockApi = vi.fn()
vi.stubGlobal('useCookie', () => ref(null))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://localhost:3000/api/v1' } }))
vi.stubGlobal('useApi', () => ({ api: mockApi }))

import { useDietStore } from '../stores/diet'

describe('Diet Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty state', () => {
    const store = useDietStore()
    expect(store.diets).toEqual([])
    expect(store.currentDiet).toBeNull()
    expect(store.generating).toBe(false)
  })

  it('fetchAll populates diets list', async () => {
    const fakeDiets = [
      { _id: '1', title: 'Dieta A', totalCalories: 2000 },
      { _id: '2', title: 'Dieta B', totalCalories: 1800 },
    ]
    mockApi.mockResolvedValue(fakeDiets)

    const store = useDietStore()
    await store.fetchAll()

    expect(store.diets).toEqual(fakeDiets)
    expect(mockApi).toHaveBeenCalledWith('/diets')
  })

  it('generate sets generating flag and adds diet to list', async () => {
    const newDiet = { _id: 'new', title: 'Nova Dieta', totalCalories: 1500 }
    mockApi.mockResolvedValue(newDiet)

    const store = useDietStore()
    const result = await store.generate()

    expect(result).toEqual(newDiet)
    expect(store.diets[0]).toEqual(newDiet)
    expect(store.currentDiet).toEqual(newDiet)
    expect(store.generating).toBe(false)
  })

  it('generate sets error on failure', async () => {
    mockApi.mockRejectedValue(new Error('Limite atingido'))

    const store = useDietStore()

    await expect(store.generate()).rejects.toThrow('Limite atingido')
    expect(store.error).toBe('Limite atingido')
    expect(store.generating).toBe(false)
  })

  // ====================================================
  // refreshMeal — Regenera refeição com IA
  // ====================================================

  it('refreshMeal updates currentDiet and refreshesRemaining', async () => {
    const refreshedDiet = {
      _id: 'diet-1',
      title: 'Dieta A',
      meals: [{ name: 'Café', foods: [{ name: 'Quinoa', quantity: '150g', calories: 200 }], totalCalories: 200 }],
      totalCalories: 200,
    }
    mockApi.mockResolvedValue({ diet: refreshedDiet, refreshesRemaining: 1 })

    const store = useDietStore()
    store.diets = [{ _id: 'diet-1', title: 'Dieta A', meals: [], totalCalories: 0 } as any]

    const result = await store.refreshMeal('diet-1', 0)

    expect(mockApi).toHaveBeenCalledWith('/diets/diet-1/meals/0/refresh', { method: 'POST' })
    expect(store.currentDiet).toEqual(refreshedDiet)
    expect(store.refreshesRemaining).toBe(1)
    expect(result?.refreshesRemaining).toBe(1)
  })

  it('refreshMeal updates diet in diets list', async () => {
    const refreshedDiet = { _id: 'diet-1', title: 'Dieta A', meals: [], totalCalories: 300 }
    mockApi.mockResolvedValue({ diet: refreshedDiet, refreshesRemaining: 5 })

    const store = useDietStore()
    store.diets = [
      { _id: 'diet-1', title: 'Dieta A', meals: [], totalCalories: 0 } as any,
      { _id: 'diet-2', title: 'Dieta B', meals: [], totalCalories: 0 } as any,
    ]

    await store.refreshMeal('diet-1', 0)

    expect(store.diets[0].totalCalories).toBe(300)
    expect(store.diets[1]._id).toBe('diet-2') // outra dieta intocada
  })

  it('refreshMeal sets error on failure', async () => {
    mockApi.mockRejectedValue(new Error('Limite de refreshes atingido'))

    const store = useDietStore()

    await expect(store.refreshMeal('diet-1', 0)).rejects.toThrow('Limite de refreshes atingido')
    expect(store.error).toBe('Limite de refreshes atingido')
    expect(store.refreshing).toBe(false)
  })
})
