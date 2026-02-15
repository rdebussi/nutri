import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do Mongoose model — simula o banco sem precisar de MongoDB real
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

// Mock do Diet model — para verificar se a dieta existe
vi.mock('../../diet/diet.model.js', () => ({
  Diet: {
    findById: vi.fn(),
  },
}))

import { Diet } from '../../diet/diet.model.js'

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
      { mealName: 'Café da manhã', completed: true },
      { mealName: 'Almoço', completed: false },
    ]

    it('should create a new check-in via upsert', async () => {
      const mockCheckIn = {
        userId,
        dietId,
        date: new Date('2026-02-15T00:00:00.000Z'),
        meals,
        adherenceRate: 50,
      }
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: dietId, userId }) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue(mockCheckIn)

      const result = await service.createOrUpdate(userId, dietId, '2026-02-15', meals)

      expect(result).toEqual(mockCheckIn)
      expect(CheckIn.findOneAndUpdate).toHaveBeenCalledWith(
        { userId, date: expect.any(Date) },
        expect.objectContaining({
          dietId,
          meals: expect.any(Array),
          adherenceRate: 50,
        }),
        { upsert: true, new: true, runValidators: true },
      )
    })

    it('should calculate adherenceRate correctly (100% when all completed)', async () => {
      const allCompleted = [
        { mealName: 'Café', completed: true },
        { mealName: 'Almoço', completed: true },
      ]
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: dietId, userId }) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue({ adherenceRate: 100 })

      await service.createOrUpdate(userId, dietId, '2026-02-15', allCompleted)

      expect(CheckIn.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ adherenceRate: 100 }),
        expect.anything(),
      )
    })

    it('should calculate adherenceRate correctly (0% when none completed)', async () => {
      const noneCompleted = [
        { mealName: 'Café', completed: false },
        { mealName: 'Almoço', completed: false },
      ]
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: dietId, userId }) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue({ adherenceRate: 0 })

      await service.createOrUpdate(userId, dietId, '2026-02-15', noneCompleted)

      expect(CheckIn.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ adherenceRate: 0 }),
        expect.anything(),
      )
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
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: dietId, userId }) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue({})

      await service.createOrUpdate(userId, dietId, '2026-02-15', meals)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      const dateUsed: Date = call[0].date
      expect(dateUsed.getHours()).toBe(0)
      expect(dateUsed.getMinutes()).toBe(0)
      expect(dateUsed.getSeconds()).toBe(0)
    })

    it('should default to today when date is not provided', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: dietId, userId }) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue({})

      await service.createOrUpdate(userId, dietId, undefined, meals)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      const dateUsed: Date = call[0].date
      const today = new Date()
      expect(dateUsed.getDate()).toBe(today.getDate())
      expect(dateUsed.getMonth()).toBe(today.getMonth())
    })

    it('should add completedAt for completed meals', async () => {
      ;(Diet.findById as any).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: dietId, userId }) })
      ;(CheckIn.findOneAndUpdate as any).mockResolvedValue({})

      await service.createOrUpdate(userId, dietId, '2026-02-15', meals)

      const call = (CheckIn.findOneAndUpdate as any).mock.calls[0]
      const mealsUsed = call[1].meals
      expect(mealsUsed[0].completedAt).toBeDefined() // completed=true
      expect(mealsUsed[1].completedAt).toBeUndefined() // completed=false
    })
  })

  // ====================================================
  // getByDate
  // ====================================================

  describe('getByDate', () => {
    it('should return check-in for specific date', async () => {
      const mockCheckIn = { userId: 'user-123', date: new Date('2026-02-15') }
      ;(CheckIn.findOne as any).mockReturnValue({ lean: vi.fn().mockResolvedValue(mockCheckIn) })

      const result = await service.getByDate('user-123', '2026-02-15')

      expect(result).toEqual(mockCheckIn)
      expect(CheckIn.findOne).toHaveBeenCalledWith({
        userId: 'user-123',
        date: expect.any(Date),
      })
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
  })

  // ====================================================
  // getWeeklyStats
  // ====================================================

  describe('getWeeklyStats', () => {
    it('should return stats for the last 7 days', async () => {
      const mockCheckIns = [
        { date: new Date('2026-02-15'), adherenceRate: 80, meals: [{ completed: true }, { completed: true }, { completed: false }] },
        { date: new Date('2026-02-14'), adherenceRate: 100, meals: [{ completed: true }, { completed: true }] },
      ]
      const mockChain = { sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockCheckIns) }) }
      ;(CheckIn.find as any).mockReturnValue(mockChain)

      const result = await service.getWeeklyStats('user-123')

      expect(result.weeklyStats).toHaveLength(2)
      expect(result.weeklyStats[0].adherenceRate).toBe(80)
      expect(result.averageAdherence).toBe(90) // (80+100)/2
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

      // Pula ontem — streak deve ser 1 (só hoje)
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
        { date: yesterday, adherenceRate: 30 }, // abaixo de 50%, quebra streak
      ]
      const mockChain = { sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(mockCheckIns) }) }
      ;(CheckIn.find as any).mockReturnValue(mockChain)

      const result = await service.getStreak('user-123')

      expect(result).toBe(1)
    })
  })
})
