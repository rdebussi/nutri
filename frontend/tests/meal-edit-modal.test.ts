import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// ====================================================
// TESTES DO MEAL EDIT — Lógica de edição + checkin store
// ====================================================
// Testa a lógica de edição de refeição: recálculo proporcional
// de macros ao editar quantidade, totais em tempo real,
// e a action editMealInCheckIn do store.

// Mock Nuxt globals
const mockApi = vi.fn()
vi.stubGlobal('useCookie', () => ref(null))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://localhost:3000/api/v1' } }))
vi.stubGlobal('useApi', () => ({ api: mockApi }))

import { useCheckinStore } from '../stores/checkin'

// ====================================================
// RECÁLCULO PROPORCIONAL
// ====================================================
// Quando o usuário edita a quantidade (gramas), os macros
// são recalculados proporcionalmente usando per-100g.

describe('proportional macro recalculation', () => {
  function recalculate(per100g: { cal: number; prot: number; carbs: number; fat: number }, newGrams: number) {
    const factor = newGrams / 100
    return {
      calories: Math.round(per100g.cal * factor),
      protein: Math.round(per100g.prot * factor * 10) / 10,
      carbs: Math.round(per100g.carbs * factor * 10) / 10,
      fat: Math.round(per100g.fat * factor * 10) / 10,
    }
  }

  it('recalculates macros for 150g from per-100g values', () => {
    const result = recalculate({ cal: 200, prot: 10, carbs: 30, fat: 5 }, 150)

    expect(result.calories).toBe(300) // 200 * 1.5
    expect(result.protein).toBe(15)   // 10 * 1.5
    expect(result.carbs).toBe(45)     // 30 * 1.5
    expect(result.fat).toBe(7.5)      // 5 * 1.5
  })

  it('recalculates macros for 50g from per-100g values', () => {
    const result = recalculate({ cal: 200, prot: 10, carbs: 30, fat: 5 }, 50)

    expect(result.calories).toBe(100) // 200 * 0.5
    expect(result.protein).toBe(5)
    expect(result.carbs).toBe(15)
    expect(result.fat).toBe(2.5)
  })

  it('handles 100g (no change)', () => {
    const result = recalculate({ cal: 128, prot: 2.5, carbs: 28, fat: 0.3 }, 100)

    expect(result.calories).toBe(128)
    expect(result.protein).toBe(2.5)
    expect(result.carbs).toBe(28)
    expect(result.fat).toBe(0.3)
  })

  it('handles small quantities', () => {
    const result = recalculate({ cal: 200, prot: 10, carbs: 30, fat: 5 }, 10)

    expect(result.calories).toBe(20)
    expect(result.protein).toBe(1)
    expect(result.carbs).toBe(3)
    expect(result.fat).toBe(0.5)
  })
})

// ====================================================
// DERIVAR PER-100G DE QUANTIDADE EXISTENTE
// ====================================================
// Quando o modal abre, precisa derivar os valores per-100g
// a partir dos valores absolutos + gramas.

describe('derive per-100g from existing food', () => {
  function derivePer100g(food: { calories: number; protein: number; carbs: number; fat: number; quantity: string }) {
    const match = food.quantity.match(/(\d+(?:\.\d+)?)\s*g/i)
    const grams = match ? parseFloat(match[1]) : 0
    if (grams <= 0) {
      return { caloriesPer100g: food.calories, proteinPer100g: food.protein, carbsPer100g: food.carbs, fatPer100g: food.fat }
    }
    return {
      caloriesPer100g: (food.calories / grams) * 100,
      proteinPer100g: (food.protein / grams) * 100,
      carbsPer100g: (food.carbs / grams) * 100,
      fatPer100g: (food.fat / grams) * 100,
    }
  }

  it('derives per-100g from 150g food', () => {
    const result = derivePer100g({
      calories: 192,
      protein: 3.75,
      carbs: 42,
      fat: 0.45,
      quantity: '150g',
    })

    expect(result.caloriesPer100g).toBe(128)
    expect(result.proteinPer100g).toBe(2.5)
    expect(result.carbsPer100g).toBeCloseTo(28)
    expect(result.fatPer100g).toBeCloseTo(0.3)
  })

  it('derives per-100g from 200g food', () => {
    const result = derivePer100g({
      calories: 400,
      protein: 40,
      carbs: 0,
      fat: 26,
      quantity: '200g',
    })

    expect(result.caloriesPer100g).toBe(200)
    expect(result.proteinPer100g).toBe(20)
    expect(result.fatPer100g).toBe(13)
  })

  it('handles non-gram quantity gracefully', () => {
    const result = derivePer100g({
      calories: 100,
      protein: 5,
      carbs: 10,
      fat: 2,
      quantity: '2 fatias',
    })

    // Sem gramas detectados, retorna valores absolutos como per-100g
    expect(result.caloriesPer100g).toBe(100)
    expect(result.proteinPer100g).toBe(5)
  })
})

// ====================================================
// TOTAL DA REFEIÇÃO
// ====================================================

describe('meal totals calculation', () => {
  function calculateTotals(foods: Array<{ calories: number; protein: number; carbs: number; fat: number }>) {
    return {
      calories: foods.reduce((sum, f) => sum + f.calories, 0),
      protein: Math.round(foods.reduce((sum, f) => sum + f.protein, 0) * 10) / 10,
      carbs: Math.round(foods.reduce((sum, f) => sum + f.carbs, 0) * 10) / 10,
      fat: Math.round(foods.reduce((sum, f) => sum + f.fat, 0) * 10) / 10,
    }
  }

  it('sums macros correctly for multiple foods', () => {
    const result = calculateTotals([
      { calories: 250, protein: 10, carbs: 40, fat: 3 },
      { calories: 90, protein: 6, carbs: 1, fat: 7 },
      { calories: 60, protein: 1, carbs: 10, fat: 2 },
    ])

    expect(result.calories).toBe(400)
    expect(result.protein).toBe(17)
    expect(result.carbs).toBe(51)
    expect(result.fat).toBe(12)
  })

  it('handles empty list', () => {
    const result = calculateTotals([])

    expect(result.calories).toBe(0)
    expect(result.protein).toBe(0)
    expect(result.carbs).toBe(0)
    expect(result.fat).toBe(0)
  })

  it('handles single food', () => {
    const result = calculateTotals([
      { calories: 350, protein: 5, carbs: 45, fat: 18 },
    ])

    expect(result.calories).toBe(350)
    expect(result.protein).toBe(5)
    expect(result.carbs).toBe(45)
    expect(result.fat).toBe(18)
  })
})

// ====================================================
// CHECKIN STORE — editMealInCheckIn
// ====================================================

describe('editMealInCheckIn store action', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('calls API with correct payload', async () => {
    const mockResponse = {
      checkIn: { _id: 'ci-1', meals: [] },
      adaptedMeals: [],
      summary: { consumed: { calories: 350 }, remaining: { calories: 1650 }, dailyTarget: { calories: 2000 }, exerciseBonus: 0 },
    }
    mockApi.mockResolvedValue(mockResponse)

    const store = useCheckinStore()
    await store.editMealInCheckIn('diet-1', 0, [
      { name: 'Sonho', quantity: '1 unidade', calories: 350, protein: 5, carbs: 45, fat: 18 },
    ])

    expect(mockApi).toHaveBeenCalledWith('/check-ins/meals/edit', {
      method: 'PATCH',
      body: {
        dietId: 'diet-1',
        mealIndex: 0,
        foods: [
          { name: 'Sonho', quantity: '1 unidade', calories: 350, protein: 5, carbs: 45, fat: 18 },
        ],
      },
    })
  })

  it('updates store state on success', async () => {
    const mockResponse = {
      checkIn: { _id: 'ci-1', meals: [{ mealName: 'Café', status: 'pending' }] },
      adaptedMeals: [{ name: 'Almoço', adapted: true, scaleFactor: 1.1 }],
      summary: { consumed: { calories: 350 }, remaining: { calories: 1650 }, dailyTarget: { calories: 2000 }, exerciseBonus: 0 },
    }
    mockApi.mockResolvedValue(mockResponse)

    const store = useCheckinStore()
    await store.editMealInCheckIn('diet-1', 0, [
      { name: 'Sonho', quantity: '1 unidade', calories: 350, protein: 5, carbs: 45, fat: 18 },
    ])

    expect(store.todayCheckIn?._id).toBe('ci-1')
    expect(store.adaptedMeals).toHaveLength(1)
    expect(store.adaptedMeals[0].adapted).toBe(true)
    expect(store.summary?.consumed.calories).toBe(350)
  })

  it('sets error on failure', async () => {
    mockApi.mockRejectedValue(new Error('Refeição inválida'))

    const store = useCheckinStore()
    await expect(
      store.editMealInCheckIn('diet-1', 99, []),
    ).rejects.toThrow('Refeição inválida')

    expect(store.error).toBe('Refeição inválida')
    expect(store.loading).toBe(false)
  })

  it('includes date when provided', async () => {
    mockApi.mockResolvedValue({
      checkIn: { _id: 'ci-1' },
      adaptedMeals: [],
      summary: { consumed: { calories: 0 }, remaining: { calories: 0 }, dailyTarget: { calories: 0 }, exerciseBonus: 0 },
    })

    const store = useCheckinStore()
    await store.editMealInCheckIn('diet-1', 0, [
      { name: 'Test', quantity: '100g', calories: 100, protein: 5, carbs: 10, fat: 2 },
    ], '2024-01-15')

    expect(mockApi).toHaveBeenCalledWith('/check-ins/meals/edit', {
      method: 'PATCH',
      body: expect.objectContaining({ date: '2024-01-15' }),
    })
  })
})
