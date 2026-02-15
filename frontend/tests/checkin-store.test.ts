import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// Mock Nuxt globals (mesma técnica dos outros stores)
const mockApi = vi.fn()
vi.stubGlobal('useCookie', () => ref(null))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://localhost:3000/api/v1' } }))
vi.stubGlobal('useApi', () => ({ api: mockApi }))

import { useCheckinStore } from '../stores/checkin'

describe('CheckIn Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty state', () => {
    const store = useCheckinStore()
    expect(store.todayCheckIn).toBeNull()
    expect(store.weeklyStats).toBeNull()
    expect(store.streak).toBe(0)
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })

  it('submitCheckIn sends data and updates state', async () => {
    const mockCheckIn = {
      _id: 'checkin-1',
      userId: 'user-1',
      dietId: 'diet-1',
      adherenceRate: 75,
      meals: [
        { mealName: 'Café', completed: true },
        { mealName: 'Almoço', completed: false },
      ],
    }
    mockApi.mockResolvedValue(mockCheckIn)

    const store = useCheckinStore()
    await store.submitCheckIn('diet-1', [
      { mealName: 'Café', completed: true },
      { mealName: 'Almoço', completed: false },
    ])

    expect(mockApi).toHaveBeenCalledWith('/check-ins', {
      method: 'POST',
      body: {
        dietId: 'diet-1',
        meals: [
          { mealName: 'Café', completed: true },
          { mealName: 'Almoço', completed: false },
        ],
      },
    })
    expect(store.todayCheckIn).toEqual(mockCheckIn)
    expect(store.loading).toBe(false)
  })

  it('submitCheckIn sets error on failure', async () => {
    mockApi.mockRejectedValue(new Error('Falha na conexão'))

    const store = useCheckinStore()

    await expect(store.submitCheckIn('diet-1', [
      { mealName: 'Café', completed: true },
    ])).rejects.toThrow('Falha na conexão')

    expect(store.error).toBe('Falha na conexão')
    expect(store.loading).toBe(false)
  })

  it('fetchToday populates todayCheckIn', async () => {
    const mockCheckIn = {
      _id: 'checkin-1',
      adherenceRate: 100,
      meals: [{ mealName: 'Café', completed: true }],
    }
    mockApi.mockResolvedValue(mockCheckIn)

    const store = useCheckinStore()
    await store.fetchToday()

    expect(mockApi).toHaveBeenCalledWith('/check-ins')
    expect(store.todayCheckIn).toEqual(mockCheckIn)
  })

  it('fetchToday handles null (no check-in today)', async () => {
    mockApi.mockResolvedValue(null)

    const store = useCheckinStore()
    await store.fetchToday()

    expect(store.todayCheckIn).toBeNull()
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
})
