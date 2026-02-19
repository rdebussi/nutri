import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// Mock Nuxt globals
const mockApi = vi.fn()
vi.stubGlobal('useCookie', () => ref(null))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://localhost:3000/api/v1' } }))
vi.stubGlobal('useApi', () => ({ api: mockApi }))

import { useCheckinStore } from '../stores/checkin'

// Mock de resposta da API (Fase 3.3 — com adaptedMeals e summary)
const mockCheckInResponse = {
  checkIn: {
    _id: 'checkin-1',
    userId: 'user-1',
    dietId: 'diet-1',
    date: '2026-02-15',
    adherenceRate: 33,
    totalCaloriesBurned: 0,
    meals: [
      { mealName: 'Café da manhã', status: 'completed' },
      { mealName: 'Almoço', status: 'skipped' },
      { mealName: 'Jantar', status: 'pending' },
    ],
    exercises: [],
  },
  adaptedMeals: [
    {
      name: 'Café da manhã', time: '07:00',
      adapted: false, scaleFactor: 1,
      foods: [{ name: 'Pão', quantity: '100g', calories: 250, protein: 8, carbs: 45, fat: 3, originalQuantity: '100g', originalCalories: 250 }],
      totalCalories: 250, originalCalories: 250,
      totalProtein: 8, totalCarbs: 45, totalFat: 3,
    },
    {
      name: 'Almoço', time: '12:00',
      adapted: false, scaleFactor: 0,
      foods: [],
      totalCalories: 0, originalCalories: 500,
      totalProtein: 0, totalCarbs: 0, totalFat: 0,
    },
    {
      name: 'Jantar', time: '20:00',
      adapted: true, scaleFactor: 1.5,
      foods: [{ name: 'Frango', quantity: '300g', calories: 600, protein: 60, carbs: 0, fat: 12, originalQuantity: '200g', originalCalories: 400 }],
      totalCalories: 750, originalCalories: 500,
      totalProtein: 60, totalCarbs: 0, totalFat: 12,
    },
  ],
  summary: {
    consumed: { calories: 250, protein: 8, carbs: 45, fat: 3 },
    remaining: { calories: 750, protein: 52, carbs: 55, fat: 22 },
    dailyTarget: { calories: 1000, protein: 60, carbs: 100, fat: 25 },
    exerciseBonus: 0,
  },
}

describe('CheckIn Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty state', () => {
    const store = useCheckinStore()
    expect(store.todayCheckIn).toBeNull()
    expect(store.adaptedMeals).toEqual([])
    expect(store.summary).toBeNull()
    expect(store.weeklyStats).toBeNull()
    expect(store.streak).toBe(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })

  it('submitCheckIn sends status-based meals and updates state with adaptations', async () => {
    mockApi.mockResolvedValue(mockCheckInResponse)

    const store = useCheckinStore()
    await store.submitCheckIn('diet-1', [
      { mealName: 'Café da manhã', status: 'completed' },
      { mealName: 'Almoço', status: 'skipped' },
      { mealName: 'Jantar', status: 'pending' },
    ])

    expect(mockApi).toHaveBeenCalledWith('/check-ins', {
      method: 'POST',
      body: {
        dietId: 'diet-1',
        meals: [
          { mealName: 'Café da manhã', status: 'completed' },
          { mealName: 'Almoço', status: 'skipped' },
          { mealName: 'Jantar', status: 'pending' },
        ],
      },
    })
    expect(store.todayCheckIn).toEqual(mockCheckInResponse.checkIn)
    expect(store.adaptedMeals).toEqual(mockCheckInResponse.adaptedMeals)
    expect(store.summary).toEqual(mockCheckInResponse.summary)
  })

  it('submitCheckIn sends exercises when provided', async () => {
    mockApi.mockResolvedValue(mockCheckInResponse)

    const store = useCheckinStore()
    const exercises = [
      { exerciseName: 'Corrida', category: 'cardio', met: 8.0, durationMinutes: 30, isExtra: true },
    ]
    await store.submitCheckIn('diet-1', [
      { mealName: 'Café da manhã', status: 'completed' },
    ], exercises)

    expect(mockApi).toHaveBeenCalledWith('/check-ins', {
      method: 'POST',
      body: {
        dietId: 'diet-1',
        meals: [{ mealName: 'Café da manhã', status: 'completed' }],
        exercises,
      },
    })
  })

  it('submitCheckIn sets error on failure', async () => {
    mockApi.mockRejectedValue(new Error('Falha na conexão'))

    const store = useCheckinStore()

    await expect(store.submitCheckIn('diet-1', [
      { mealName: 'Café', status: 'completed' },
    ])).rejects.toThrow('Falha na conexão')

    expect(store.error).toBe('Falha na conexão')
    expect(store.loading).toBe(false)
  })

  it('fetchToday populates check-in and adaptations', async () => {
    mockApi.mockResolvedValue(mockCheckInResponse)

    const store = useCheckinStore()
    await store.fetchToday()

    expect(mockApi).toHaveBeenCalledWith('/check-ins')
    expect(store.todayCheckIn).toEqual(mockCheckInResponse.checkIn)
    expect(store.adaptedMeals).toHaveLength(3)
    expect(store.summary?.consumed.calories).toBe(250)
  })

  it('fetchToday handles null (no check-in today)', async () => {
    mockApi.mockResolvedValue(null)

    const store = useCheckinStore()
    await store.fetchToday()

    expect(store.todayCheckIn).toBeNull()
    expect(store.adaptedMeals).toEqual([])
    expect(store.summary).toBeNull()
  })

  it('fetchWeeklyStats populates stats and streak', async () => {
    const mockStats = {
      weeklyStats: [
        { date: '2026-02-15', adherenceRate: 80, mealsCompleted: 4, mealsTotal: 5 },
      ],
      streak: 3,
      averageAdherence: 80,
    }
    mockApi.mockResolvedValue(mockStats)

    const store = useCheckinStore()
    await store.fetchWeeklyStats()

    expect(mockApi).toHaveBeenCalledWith('/check-ins/stats')
    expect(store.weeklyStats).toEqual(mockStats)
    expect(store.streak).toBe(3)
  })

  it('adapted meals reflect skipped meal redistribution', async () => {
    mockApi.mockResolvedValue(mockCheckInResponse)

    const store = useCheckinStore()
    await store.fetchToday()

    // Almoço skipped → 0 calorias
    const almoco = store.adaptedMeals.find(m => m.name === 'Almoço')!
    expect(almoco.totalCalories).toBe(0)
    expect(almoco.adapted).toBe(false)

    // Jantar adaptado → calorias aumentadas
    const jantar = store.adaptedMeals.find(m => m.name === 'Jantar')!
    expect(jantar.adapted).toBe(true)
    expect(jantar.scaleFactor).toBe(1.5)
    expect(jantar.totalCalories).toBe(750) // escalado de 500
  })

  // ====================================================
  // swapFoodInCheckIn — Troca por dia (não altera a dieta base)
  // ====================================================

  it('swapFoodInCheckIn calls API and updates state', async () => {
    const swapResponse = {
      checkIn: {
        ...mockCheckInResponse.checkIn,
        foodOverrides: [{ mealIndex: 0, foodIndex: 0, originalFood: {}, newFood: { name: 'Batata doce' } }],
      },
      adaptedMeals: mockCheckInResponse.adaptedMeals,
      summary: mockCheckInResponse.summary,
    }
    mockApi.mockResolvedValue(swapResponse)

    const store = useCheckinStore()
    const result = await store.swapFoodInCheckIn('diet-1', 0, 0, 'food-batata')

    expect(mockApi).toHaveBeenCalledWith('/check-ins/foods/swap', {
      method: 'PATCH',
      body: { dietId: 'diet-1', mealIndex: 0, foodIndex: 0, newFoodId: 'food-batata' },
    })
    expect(store.todayCheckIn).toEqual(swapResponse.checkIn)
    expect(store.adaptedMeals).toEqual(swapResponse.adaptedMeals)
    expect(result).toBeDefined()
  })

  it('swapFoodInCheckIn includes optional date', async () => {
    mockApi.mockResolvedValue(mockCheckInResponse)

    const store = useCheckinStore()
    await store.swapFoodInCheckIn('diet-1', 0, 0, 'food-batata', '2026-02-15')

    expect(mockApi).toHaveBeenCalledWith('/check-ins/foods/swap', {
      method: 'PATCH',
      body: { dietId: 'diet-1', mealIndex: 0, foodIndex: 0, newFoodId: 'food-batata', date: '2026-02-15' },
    })
  })

  it('swapFoodInCheckIn sets error on failure', async () => {
    mockApi.mockRejectedValue(new Error('Alimento não encontrado'))

    const store = useCheckinStore()
    await expect(store.swapFoodInCheckIn('diet-1', 0, 0, 'bad-id')).rejects.toThrow('Alimento não encontrado')

    expect(store.error).toBe('Alimento não encontrado')
    expect(store.loading).toBe(false)
  })

  // ====================================================
  // editMealInCheckIn — Edição de refeição (por dia)
  // ====================================================

  it('editMealInCheckIn calls API with correct payload', async () => {
    const editResponse = {
      checkIn: { ...mockCheckInResponse.checkIn, mealOverrides: [{ mealIndex: 0, editedFoods: [] }] },
      adaptedMeals: mockCheckInResponse.adaptedMeals,
      summary: mockCheckInResponse.summary,
    }
    mockApi.mockResolvedValue(editResponse)

    const store = useCheckinStore()
    await store.editMealInCheckIn('diet-1', 0, [
      { name: 'Sonho', quantity: '1 unidade', calories: 350, protein: 5, carbs: 45, fat: 18 },
    ])

    expect(mockApi).toHaveBeenCalledWith('/check-ins/meals/edit', {
      method: 'PATCH',
      body: {
        dietId: 'diet-1',
        mealIndex: 0,
        foods: [{ name: 'Sonho', quantity: '1 unidade', calories: 350, protein: 5, carbs: 45, fat: 18 }],
      },
    })
    expect(store.todayCheckIn).toEqual(editResponse.checkIn)
    expect(store.adaptedMeals).toEqual(editResponse.adaptedMeals)
  })

  it('editMealInCheckIn sets error on failure', async () => {
    mockApi.mockRejectedValue(new Error('Refeição inválida'))

    const store = useCheckinStore()
    await expect(store.editMealInCheckIn('diet-1', 99, [])).rejects.toThrow('Refeição inválida')

    expect(store.error).toBe('Refeição inválida')
    expect(store.loading).toBe(false)
  })
})
