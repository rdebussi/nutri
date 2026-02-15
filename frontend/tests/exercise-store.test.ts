import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

// Mock Nuxt globals
const mockApi = vi.fn()
vi.stubGlobal('useCookie', () => ref(null))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({ public: { apiBase: 'http://localhost:3000/api/v1' } }))
vi.stubGlobal('useApi', () => ({ api: mockApi }))

import { useExerciseStore } from '../stores/exercise'

describe('Exercise Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty state', () => {
    const store = useExerciseStore()
    expect(store.exercises).toEqual([])
    expect(store.routines).toEqual([])
    expect(store.tdee).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBe('')
  })

  it('fetchExercises populates exercises list', async () => {
    const mockExercises = [
      { _id: '1', name: 'Musculação', category: 'strength', met: 6.0 },
      { _id: '2', name: 'Corrida', category: 'cardio', met: 8.0 },
    ]
    mockApi.mockResolvedValue(mockExercises)

    const store = useExerciseStore()
    await store.fetchExercises()

    expect(mockApi).toHaveBeenCalledWith('/exercises')
    expect(store.exercises).toEqual(mockExercises)
  })

  it('fetchExercises with filters builds correct URL', async () => {
    mockApi.mockResolvedValue([])

    const store = useExerciseStore()
    await store.fetchExercises({ search: 'muscu', category: 'strength' })

    expect(mockApi).toHaveBeenCalledWith('/exercises?search=muscu&category=strength')
  })

  it('fetchRoutines populates routines', async () => {
    const mockRoutines = [
      { id: 'r1', exerciseName: 'Musculação', category: 'strength', met: 6.0, daysPerWeek: 4, durationMinutes: 60, intensity: 'MODERATE' },
    ]
    mockApi.mockResolvedValue(mockRoutines)

    const store = useExerciseStore()
    await store.fetchRoutines()

    expect(mockApi).toHaveBeenCalledWith('/users/me/routines')
    expect(store.routines).toEqual(mockRoutines)
  })

  it('saveRoutines sends data and updates state', async () => {
    const newRoutines = [
      { exerciseName: 'Corrida', category: 'cardio', met: 8.0, daysPerWeek: 3, durationMinutes: 30, intensity: 'MODERATE' },
    ]
    const savedRoutines = newRoutines.map((r, i) => ({ id: `r${i}`, ...r }))
    mockApi.mockResolvedValue(savedRoutines)

    const store = useExerciseStore()
    await store.saveRoutines(newRoutines)

    expect(mockApi).toHaveBeenCalledWith('/users/me/routines', {
      method: 'PUT',
      body: { routines: newRoutines },
    })
    expect(store.routines).toEqual(savedRoutines)
    expect(store.loading).toBe(false)
  })

  it('saveRoutines sets error on failure', async () => {
    mockApi.mockRejectedValue(new Error('Erro de rede'))

    const store = useExerciseStore()
    await expect(store.saveRoutines([])).rejects.toThrow('Erro de rede')

    expect(store.error).toBe('Erro de rede')
    expect(store.loading).toBe(false)
  })

  it('fetchTDEE populates TDEE data', async () => {
    const mockTDEE = {
      bmr: 1749,
      tdee: 2464,
      adjustedTdee: 2834,
      goal: 'GAIN_MUSCLE',
      age: 30,
      routines: 2,
    }
    mockApi.mockResolvedValue(mockTDEE)

    const store = useExerciseStore()
    await store.fetchTDEE()

    expect(mockApi).toHaveBeenCalledWith('/users/me/tdee')
    expect(store.tdee).toEqual(mockTDEE)
  })

  it('fetchTDEE silently handles error (sets null)', async () => {
    mockApi.mockRejectedValue(new Error('Perfil incompleto'))

    const store = useExerciseStore()
    await store.fetchTDEE()

    // Não lança erro, apenas seta null
    expect(store.tdee).toBeNull()
  })
})
