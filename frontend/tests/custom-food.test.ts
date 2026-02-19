import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed, nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// ====================================================
// TESTES DO CUSTOM FOOD — Lógica de normalização
// ====================================================
// Testa a lógica de conversão per-serving → per-100g
// e validação do formulário de alimento customizado.
//
// Nota: testar componentes Vue com UModal do Nuxt UI é
// complexo. Focamos na lógica do store e na normalização.

// Mock Nuxt globals
const mockApi = vi.fn()
vi.stubGlobal('useCookie', () => ref(null))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://localhost:3000/api/v1' } }))
vi.stubGlobal('useApi', () => ({ api: mockApi }))

import { useFoodStore } from '../stores/food'
import type { CreateCustomFoodInput } from '../stores/food'

describe('Custom Food Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  // ====================================================
  // NORMALIZAÇÃO PER-SERVING → PER-100G
  // ====================================================
  // O backend faz a conversão real, mas testamos aqui
  // que o store envia os dados no formato correto.

  describe('per-100g input mode', () => {
    it('sends per-100g macros directly', async () => {
      mockApi.mockResolvedValue({ _id: '1', name: 'Granola caseira' })

      const store = useFoodStore()
      await store.createCustomFood({
        name: 'Granola caseira',
        category: 'grains',
        caloriesPer100g: 450,
        proteinPer100g: 12,
        carbsPer100g: 60,
        fatPer100g: 18,
      })

      expect(mockApi).toHaveBeenCalledWith('/foods/custom', {
        method: 'POST',
        body: {
          name: 'Granola caseira',
          category: 'grains',
          caloriesPer100g: 450,
          proteinPer100g: 12,
          carbsPer100g: 60,
          fatPer100g: 18,
        },
      })
    })
  })

  describe('per-serving input mode', () => {
    it('sends serving data for backend conversion', async () => {
      mockApi.mockResolvedValue({ _id: '1', name: 'Panqueca de aveia' })

      const store = useFoodStore()
      await store.createCustomFood({
        name: 'Panqueca de aveia',
        category: 'grains',
        servingSize: 80,
        servingName: '1 panqueca',
        caloriesPerServing: 180,
        proteinPerServing: 8,
        carbsPerServing: 22,
        fatPerServing: 7,
      })

      expect(mockApi).toHaveBeenCalledWith('/foods/custom', {
        method: 'POST',
        body: expect.objectContaining({
          servingSize: 80,
          servingName: '1 panqueca',
          caloriesPerServing: 180,
          proteinPerServing: 8,
          carbsPerServing: 22,
          fatPerServing: 7,
        }),
      })
    })
  })

  // ====================================================
  // NORMALIZAÇÃO LOCAL (preview no modal)
  // ====================================================
  // Replica a lógica do computed normalizedPreview

  describe('normalization preview', () => {
    function normalize(servingSize: number, macros: { cal: number; prot: number; carbs: number; fat: number }) {
      const factor = 100 / servingSize
      return {
        calories: Math.round(macros.cal * factor * 10) / 10,
        protein: Math.round(macros.prot * factor * 10) / 10,
        carbs: Math.round(macros.carbs * factor * 10) / 10,
        fat: Math.round(macros.fat * factor * 10) / 10,
      }
    }

    it('converts 80g serving to per-100g correctly', () => {
      const result = normalize(80, { cal: 180, prot: 8, carbs: 22, fat: 7 })

      // 180 * (100/80) = 225
      expect(result.calories).toBe(225)
      expect(result.protein).toBe(10)
      expect(result.carbs).toBe(27.5)
      expect(result.fat).toBe(8.8)
    })

    it('converts 50g serving to per-100g correctly', () => {
      const result = normalize(50, { cal: 100, prot: 5, carbs: 15, fat: 3 })

      // 100 * (100/50) = 200
      expect(result.calories).toBe(200)
      expect(result.protein).toBe(10)
      expect(result.carbs).toBe(30)
      expect(result.fat).toBe(6)
    })

    it('handles 100g serving (no conversion needed)', () => {
      const result = normalize(100, { cal: 250, prot: 10, carbs: 35, fat: 8 })

      expect(result.calories).toBe(250)
      expect(result.protein).toBe(10)
      expect(result.carbs).toBe(35)
      expect(result.fat).toBe(8)
    })

    it('handles large serving sizes', () => {
      const result = normalize(200, { cal: 300, prot: 20, carbs: 40, fat: 10 })

      // 300 * (100/200) = 150
      expect(result.calories).toBe(150)
      expect(result.protein).toBe(10)
      expect(result.carbs).toBe(20)
      expect(result.fat).toBe(5)
    })
  })

  // ====================================================
  // CRUD DO STORE
  // ====================================================

  describe('store CRUD operations', () => {
    it('createCustomFood adds item to customFoods array', async () => {
      const newFood = {
        _id: 'new-1',
        name: 'Vitamina de banana',
        category: 'beverages',
        caloriesPer100g: 85,
        proteinPer100g: 3,
        carbsPer100g: 18,
        fatPer100g: 1,
      }
      mockApi.mockResolvedValue(newFood)

      const store = useFoodStore()
      expect(store.customFoods).toHaveLength(0)

      await store.createCustomFood({
        name: 'Vitamina de banana',
        category: 'beverages',
        caloriesPer100g: 85,
        proteinPer100g: 3,
        carbsPer100g: 18,
        fatPer100g: 1,
      })

      expect(store.customFoods).toHaveLength(1)
      expect(store.customFoods[0]).toEqual(newFood)
    })

    it('createCustomFood includes ingredients when provided', async () => {
      mockApi.mockResolvedValue({ _id: '1', name: 'Panqueca de aveia' })

      const store = useFoodStore()
      await store.createCustomFood({
        name: 'Panqueca de aveia',
        category: 'grains',
        ingredients: '2 ovos, 50g aveia, 1 banana',
        caloriesPer100g: 200,
        proteinPer100g: 10,
        carbsPer100g: 25,
        fatPer100g: 8,
      })

      expect(mockApi).toHaveBeenCalledWith('/foods/custom', {
        method: 'POST',
        body: expect.objectContaining({
          ingredients: '2 ovos, 50g aveia, 1 banana',
        }),
      })
    })

    it('deleteCustomFood removes correct item', async () => {
      const store = useFoodStore()
      store.customFoods = [
        { _id: 'a', name: 'Food A' } as any,
        { _id: 'b', name: 'Food B' } as any,
        { _id: 'c', name: 'Food C' } as any,
      ]

      mockApi.mockResolvedValue({})
      await store.deleteCustomFood('b')

      expect(store.customFoods).toHaveLength(2)
      expect(store.customFoods.map(f => f._id)).toEqual(['a', 'c'])
    })

    it('updateCustomFood replaces correct item in array', async () => {
      const store = useFoodStore()
      store.customFoods = [
        { _id: 'a', name: 'Food A', caloriesPer100g: 100 } as any,
        { _id: 'b', name: 'Food B', caloriesPer100g: 200 } as any,
      ]

      const updated = { _id: 'b', name: 'Food B Updated', caloriesPer100g: 220 }
      mockApi.mockResolvedValue(updated)

      await store.updateCustomFood('b', { name: 'Food B Updated' })

      expect(store.customFoods[1]).toEqual(updated)
      expect(store.customFoods[0].name).toBe('Food A') // Não afetou o outro
    })
  })
})
