import { describe, it, expect, vi, beforeEach } from 'vitest'

// ====================================================
// TESTES DO CHECK-IN SERVICE — Fase 3.3
// ====================================================
// Agora com:
// - status (pending/completed/skipped) em vez de completed boolean
// - Resposta inclui adaptedMeals e summary (recálculo)
// - Exercícios extras impactam refeições restantes

// Mock do Mongoose model
vi.mock('../checkin.model.js', () => ({
  CheckIn: {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

import { CheckIn } from '../checkin.model.js'
import { CheckInService } from '../checkin.service.js'

// Mock do Diet model
vi.mock('../../diet/diet.model.js', () => ({
  Diet: {
    findById: vi.fn(),
  },
}))

import { Diet } from '../../diet/diet.model.js'

// Dieta mock com estrutura completa (para o recálculo funcionar)
const mockDiet = {
  _id: 'diet-456',
  userId: 'user-123',
  meals: [
    {
      name: 'Café da manhã', time: '07:00', totalCalories: 400,
      foods: [
        { name: 'Pão', quantity: '100g', calories: 250, protein: 8, carbs: 45, fat: 3 },
        { name: 'Ovo', quantity: '2 unidades', calories: 150, protein: 12, carbs: 1, fat: 10 },
      ],
    },
    {
      name: 'Almoço', time: '12:00', totalCalories: 600,
      foods: [
        { name: 'Arroz', quantity: '150g', calories: 200, protein: 4, carbs: 44, fat: 1 },
        { name: 'Frango', quantity: '200g', calories: 400, protein: 40, carbs: 0, fat: 8 },
      ],
    },
    {
      name: 'Jantar', time: '20:00', totalCalories: 500,
      foods: [
        { name: 'Salada', quantity: '100g', calories: 50, protein: 2, carbs: 8, fat: 1 },
        { name: 'Peixe', quantity: '180g', calories: 450, protein: 36, carbs: 0, fat: 15 },
      ],
    },
  ],
  totalCalories: 1500,
  totalProtein: 102,
  totalCarbs: 98,
  totalFat: 38,
}

// Check-in mock retornado pelo MongoDB
function makeMockCheckIn(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user-123',
    dietId: 'diet-456',
    date: new Date('2026-02-15T00:00:00.000Z'),
    meals: [
      { mealName: 'Café da manhã', status: 'completed', completedAt: new Date() },
      { mealName: 'Almoço', status: 'pending' },
      { mealName: 'Jantar', status: 'pending' },
    ],
    exercises: [],
    adherenceRate: 33,
    totalCaloriesBurned: 0,
    ...overrides,
  }
}

describe('CheckInService', () => {
  let service: CheckInService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CheckInService()
  })

  // ====================================================
  // createOrUpdate
  // ====================================================

  describe('createOrUpdate', () => {
    const userId = 'user-123'
    const dietId = 'diet-456'
    const meals = [
      { mealName: 'Café da manhã', status: 'completed' as const },
      { mealName: 'Almoço', status: 'pending' as const },
      { mealName: 'Jantar', status: 'pending' as const },
    ]

    it('should create check-in and return adapted meals', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn())

      const result = await service.createOrUpdate(userId, dietId, '2026-02-15', meals)

      expect(result.checkIn).toBeDefined()
      expect(result.adaptedMeals).toBeDefined()
      expect(result.adaptedMeals).toHaveLength(3)
      expect(result.summary).toBeDefined()
      expect(result.summary.consumed.calories).toBe(400) // café da manhã
    })

    it('should calculate adherenceRate from status (33% when 1/3 completed)', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn())

      await service.createOrUpdate(userId, dietId, '2026-02-15', meals)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      expect(call[1].adherenceRate).toBe(33)
    })

    it('should calculate 100% adherence when all completed', async () => {
      const allCompleted = [
        { mealName: 'Café da manhã', status: 'completed' as const },
        { mealName: 'Almoço', status: 'completed' as const },
        { mealName: 'Jantar', status: 'completed' as const },
      ]
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn({
        meals: allCompleted.map(m => ({ ...m, completedAt: new Date() })),
        adherenceRate: 100,
      }))

      await service.createOrUpdate(userId, dietId, '2026-02-15', allCompleted)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      expect(call[1].adherenceRate).toBe(100)
    })

    it('should set skippedAt for skipped meals', async () => {
      const withSkip = [
        { mealName: 'Café da manhã', status: 'completed' as const },
        { mealName: 'Almoço', status: 'skipped' as const },
        { mealName: 'Jantar', status: 'pending' as const },
      ]
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn())

      await service.createOrUpdate(userId, dietId, '2026-02-15', withSkip)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      const savedMeals = call[1].meals
      expect(savedMeals[0].completedAt).toBeDefined()  // completed
      expect(savedMeals[1].skippedAt).toBeDefined()     // skipped
      expect(savedMeals[2].completedAt).toBeUndefined() // pending
      expect(savedMeals[2].skippedAt).toBeUndefined()   // pending
    })

    it('should throw NotFoundError if diet does not exist', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

      await expect(service.createOrUpdate(userId, dietId, '2026-02-15', meals))
        .rejects.toThrow('Dieta não encontrada')
    })

    it('should throw AppError if diet belongs to another user', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: dietId, userId: 'other-user' }) })

      await expect(service.createOrUpdate(userId, dietId, '2026-02-15', meals))
        .rejects.toThrow('Acesso negado')
    })

    it('should normalize date to start of day', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn())

      await service.createOrUpdate(userId, dietId, '2026-02-15', meals)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      const dateUsed: Date = call[0].date
      expect(dateUsed.getHours()).toBe(0)
      expect(dateUsed.getMinutes()).toBe(0)
    })

    it('should default to today when date is not provided', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn())

      await service.createOrUpdate(userId, dietId, undefined, meals)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      const dateUsed: Date = call[0].date
      const today = new Date()
      expect(dateUsed.getDate()).toBe(today.getDate())
    })

    it('should calculate exercise calories and include in check-in', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn({
        exercises: [{ exerciseName: 'Corrida', caloriesBurned: 560, isExtra: true }],
        totalCaloriesBurned: 560,
      }))

      const exercises = [
        { exerciseName: 'Corrida', category: 'cardio', met: 8.0, durationMinutes: 60, isExtra: true },
      ]

      await service.createOrUpdate(userId, dietId, '2026-02-15', meals, exercises, 70)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      const data = call[1]
      expect(data.exercises).toHaveLength(1)
      expect(data.exercises[0].caloriesBurned).toBe(560)
      expect(data.totalCaloriesBurned).toBe(560)
    })

    it('should handle multiple exercises in check-in', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn())

      const exercises = [
        { exerciseName: 'Musculação', category: 'strength', met: 6.0, durationMinutes: 60 },
        { exerciseName: 'Corrida', category: 'cardio', met: 8.0, durationMinutes: 30, isExtra: true },
      ]

      await service.createOrUpdate(userId, dietId, '2026-02-15', meals, exercises, 80)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      const data = call[1]
      expect(data.exercises).toHaveLength(2)
      expect(data.exercises[0].caloriesBurned).toBe(480) // 6.0 × 80 × 1h
      expect(data.exercises[1].caloriesBurned).toBe(320) // 8.0 × 80 × 0.5h
      expect(data.totalCaloriesBurned).toBe(800)
    })

    it('should default to empty exercises when not provided', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn())

      await service.createOrUpdate(userId, dietId, '2026-02-15', meals)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      const data = call[1]
      expect(data.exercises).toEqual([])
      expect(data.totalCaloriesBurned).toBe(0)
    })
  })

  // ====================================================
  // createOrUpdate — ADAPTED MEALS (Fase 3.3)
  // ====================================================

  describe('createOrUpdate — adapted meals', () => {
    const userId = 'user-123'
    const dietId = 'diet-456'

    it('should redistribute macros when a meal is skipped', async () => {
      const mealsWithSkip = [
        { mealName: 'Café da manhã', status: 'completed' as const },
        { mealName: 'Almoço', status: 'skipped' as const },
        { mealName: 'Jantar', status: 'pending' as const },
      ]

      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn({
        meals: mealsWithSkip.map(m => ({
          mealName: m.mealName,
          status: m.status,
          completedAt: m.status === 'completed' ? new Date() : undefined,
          skippedAt: m.status === 'skipped' ? new Date() : undefined,
        })),
      }))

      const result = await service.createOrUpdate(userId, dietId, '2026-02-15', mealsWithSkip)

      // consumed = café 400
      expect(result.summary.consumed.calories).toBe(400)
      // remaining = 1500 - 400 = 1100 (todo o jantar, que era 500)
      expect(result.summary.remaining.calories).toBe(1100)

      // Jantar pendente deve ter sido escalado para cima
      const jantar = result.adaptedMeals.find(m => m.name === 'Jantar')!
      expect(jantar.adapted).toBe(true)
      expect(jantar.totalCalories).toBeGreaterThan(500) // escalado
      expect(jantar.scaleFactor).toBeGreaterThan(1)
    })

    it('should increase calories when extra exercise is logged', async () => {
      const mealsAllPending = [
        { mealName: 'Café da manhã', status: 'completed' as const },
        { mealName: 'Almoço', status: 'pending' as const },
        { mealName: 'Jantar', status: 'pending' as const },
      ]

      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn({
        meals: mealsAllPending.map(m => ({
          mealName: m.mealName,
          status: m.status,
          completedAt: m.status === 'completed' ? new Date() : undefined,
        })),
        exercises: [{ exerciseName: 'Futebol', caloriesBurned: 500, isExtra: true }],
        totalCaloriesBurned: 500,
      }))

      const exercises = [
        { exerciseName: 'Futebol', category: 'sports', met: 7.0, durationMinutes: 90, isExtra: true },
      ]

      const result = await service.createOrUpdate(userId, dietId, '2026-02-15', mealsAllPending, exercises, 70)

      // exerciseBonus = 500 (from mock check-in, not from exercise input calculation)
      expect(result.summary.exerciseBonus).toBe(500)
      // dailyTarget = 1500 + 500 = 2000
      expect(result.summary.dailyTarget.calories).toBe(2000)
    })

    it('should mark completed meals as not adapted', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockDiet) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(makeMockCheckIn())

      const meals = [
        { mealName: 'Café da manhã', status: 'completed' as const },
        { mealName: 'Almoço', status: 'pending' as const },
        { mealName: 'Jantar', status: 'pending' as const },
      ]

      const result = await service.createOrUpdate('user-123', 'diet-456', '2026-02-15', meals)

      const cafe = result.adaptedMeals.find(m => m.name === 'Café da manhã')!
      expect(cafe.adapted).toBe(false)
      expect(cafe.scaleFactor).toBe(1)
      expect(cafe.totalCalories).toBe(400)
    })
  })

  // ====================================================
  // getByDate
  // ====================================================

  describe('getByDate', () => {
    it('should return check-in with adapted meals', async () => {
      ;(CheckIn.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(makeMockCheckIn()),
      })
      ;(Diet.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockDiet),
      })

      const result = await service.getByDate('user-123', '2026-02-15')

      expect(result).not.toBeNull()
      expect(result!.checkIn).toBeDefined()
      expect(result!.adaptedMeals).toHaveLength(3)
      expect(result!.summary).toBeDefined()
    })

    it('should return null when no check-in exists', async () => {
      ;(CheckIn.findOne as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

      const result = await service.getByDate('user-123', '2026-02-15')

      expect(result).toBeNull()
    })

    it('should default to today when date is not provided', async () => {
      ;(CheckIn.findOne as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

      await service.getByDate('user-123')

      const call = (CheckIn.findOne as any).mock.calls[0]
      const dateUsed: Date = call[0].date
      const today = new Date()
      expect(dateUsed.getDate()).toBe(today.getDate())
    })

    it('should handle missing diet gracefully', async () => {
      ;(CheckIn.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(makeMockCheckIn()),
      })
      ;(Diet.findById as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      })

      const result = await service.getByDate('user-123', '2026-02-15')

      expect(result).not.toBeNull()
      expect(result!.adaptedMeals).toEqual([])
      expect(result!.summary.dailyTarget.calories).toBe(0)
    })
  })

  // ====================================================
  // getWeeklyStats
  // ====================================================

  describe('getWeeklyStats', () => {
    it('should return stats for the last 7 days using status field', async () => {
      const mockCheckIns = [
        {
          date: new Date('2026-02-15'),
          adherenceRate: 67,
          meals: [
            { mealName: 'Café', status: 'completed' },
            { mealName: 'Almoço', status: 'completed' },
            { mealName: 'Jantar', status: 'skipped' },
          ],
        },
        {
          date: new Date('2026-02-14'),
          adherenceRate: 100,
          meals: [
            { mealName: 'Café', status: 'completed' },
            { mealName: 'Almoço', status: 'completed' },
          ],
        },
      ]
      const mockChain = { sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockCheckIns) }) }
      ;(CheckIn.find as any).mockReturnValue(mockChain)

      const result = await service.getWeeklyStats('user-123')

      expect(result.weeklyStats).toHaveLength(2)
      expect(result.weeklyStats[0].mealsCompleted).toBe(2) // 2 completed out of 3
      expect(result.weeklyStats[0].mealsTotal).toBe(3)
      expect(result.averageAdherence).toBe(84) // (67+100)/2
    })

    it('should return empty stats when no check-ins exist', async () => {
      const mockChain = { sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }
      ;(CheckIn.find as any).mockReturnValue(mockChain)

      const result = await service.getWeeklyStats('user-123')

      expect(result.weeklyStats).toEqual([])
      expect(result.averageAdherence).toBe(0)
      expect(result.streak).toBe(0)
    })
  })

  // ====================================================
  // getStreak
  // ====================================================

  describe('getStreak', () => {
    it('should calculate consecutive days streak', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const mockCheckIns = [
        { date: today, adherenceRate: 80 },
        { date: yesterday, adherenceRate: 60 },
        { date: twoDaysAgo, adherenceRate: 90 },
      ]
      const mockChain = { sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockCheckIns) }) }
      ;(CheckIn.find as any).mockReturnValue(mockChain)

      const result = await service.getStreak('user-123')

      expect(result).toBe(3)
    })

    it('should return 0 when no check-ins exist', async () => {
      const mockChain = { sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }
      ;(CheckIn.find as any).mockReturnValue(mockChain)

      const result = await service.getStreak('user-123')

      expect(result).toBe(0)
    })

    it('should break streak when a day is missing', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const mockCheckIns = [
        { date: today, adherenceRate: 80 },
        { date: twoDaysAgo, adherenceRate: 90 },
      ]
      const mockChain = { sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockCheckIns) }) }
      ;(CheckIn.find as any).mockReturnValue(mockChain)

      const result = await service.getStreak('user-123')

      expect(result).toBe(1)
    })

    it('should not count days with adherenceRate <= 50%', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const mockCheckIns = [
        { date: today, adherenceRate: 80 },
        { date: yesterday, adherenceRate: 30 },
      ]
      const mockChain = { sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockCheckIns) }) }
      ;(CheckIn.find as any).mockReturnValue(mockChain)

      const result = await service.getStreak('user-123')

      expect(result).toBe(1)
    })
  })
})
