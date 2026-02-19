import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserFoodService } from '../user-food.service.js'

// ====================================================
// TESTES DO USER FOOD SERVICE
// ====================================================
// CRUD de alimentos customizados + conversão por porção.

// Mock do UserFood model
const mockCreate = vi.fn()
const mockFind = vi.fn()
const mockFindById = vi.fn()
const mockFindByIdAndUpdate = vi.fn()
const mockFindByIdAndDelete = vi.fn()

vi.mock('../user-food.model.js', () => ({
  UserFood: {
    create: (...args: any[]) => mockCreate(...args),
    find: (...args: any[]) => mockFind(...args),
    findById: (...args: any[]) => mockFindById(...args),
    findByIdAndUpdate: (...args: any[]) => mockFindByIdAndUpdate(...args),
    findByIdAndDelete: (...args: any[]) => mockFindByIdAndDelete(...args),
  },
}))

const userId = 'user-123'

describe('UserFoodService', () => {
  let service: UserFoodService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new UserFoodService()
  })

  // ====================================================
  // CREATE
  // ====================================================

  describe('create', () => {
    it('should create a custom food with per-100g macros', async () => {
      const input = {
        name: 'Panqueca de aveia',
        category: 'grains' as const,
        caloriesPer100g: 250,
        proteinPer100g: 10,
        carbsPer100g: 30,
        fatPer100g: 8,
      }

      const saved = { _id: 'food-1', userId, ...input }
      mockCreate.mockResolvedValue(saved)

      const result = await service.create(userId, input)

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        name: 'Panqueca de aveia',
        caloriesPer100g: 250,
        proteinPer100g: 10,
        carbsPer100g: 30,
        fatPer100g: 8,
      }))
      expect(result).toEqual(saved)
    })

    it('should convert per-serving macros to per-100g', async () => {
      const input = {
        name: 'Panqueca de aveia',
        category: 'grains' as const,
        servingSize: 80,           // 1 panqueca = 80g
        servingName: '1 panqueca',
        caloriesPerServing: 200,   // 200 kcal por panqueca
        proteinPerServing: 8,
        carbsPerServing: 24,
        fatPerServing: 6.4,
      }

      mockCreate.mockImplementation((data: any) => Promise.resolve({ _id: 'food-2', ...data }))

      await service.create(userId, input)

      // 200 kcal / 80g * 100 = 250 kcal/100g
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        name: 'Panqueca de aveia',
        caloriesPer100g: 250,
        proteinPer100g: 10,        // 8 / 80 * 100
        carbsPer100g: 30,          // 24 / 80 * 100
        fatPer100g: 8,             // 6.4 / 80 * 100
        servingSize: 80,
        servingName: '1 panqueca',
      }))
    })

    it('should round converted macros to 1 decimal', async () => {
      const input = {
        name: 'Granola caseira',
        category: 'grains' as const,
        servingSize: 30,
        caloriesPerServing: 140,
        proteinPerServing: 3.5,
        carbsPerServing: 18,
        fatPerServing: 6,
      }

      mockCreate.mockImplementation((data: any) => Promise.resolve({ _id: 'food-3', ...data }))

      await service.create(userId, input)

      // 140 / 30 * 100 = 466.666... → 466.7
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        caloriesPer100g: 466.7,
        proteinPer100g: 11.7,      // 3.5 / 30 * 100 = 11.666... → 11.7
        carbsPer100g: 60,          // 18 / 30 * 100 = 60
        fatPer100g: 20,            // 6 / 30 * 100 = 20
      }))
    })
  })

  // ====================================================
  // LIST
  // ====================================================

  describe('list', () => {
    it('should list foods for the user', async () => {
      const foods = [
        { _id: '1', userId, name: 'Panqueca de aveia' },
        { _id: '2', userId, name: 'Shake proteico' },
      ]
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(foods),
        }),
      })

      const result = await service.list(userId)

      expect(mockFind).toHaveBeenCalledWith({ userId })
      expect(result).toHaveLength(2)
    })

    it('should filter by search and category', async () => {
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      })

      await service.list(userId, 'panqueca', 'grains')

      expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        category: 'grains',
        name: expect.any(RegExp),
      }))
    })
  })

  // ====================================================
  // UPDATE
  // ====================================================

  describe('update', () => {
    it('should update a custom food', async () => {
      const existing = { _id: 'food-1', userId, name: 'Panqueca' }
      mockFindById.mockResolvedValue(existing)

      const updated = { ...existing, name: 'Panqueca de aveia' }
      mockFindByIdAndUpdate.mockResolvedValue(updated)

      const result = await service.update(userId, 'food-1', { name: 'Panqueca de aveia' })

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'food-1',
        { $set: { name: 'Panqueca de aveia' } },
        { new: true, runValidators: true },
      )
      expect(result.name).toBe('Panqueca de aveia')
    })

    it('should throw NotFoundError if food does not exist', async () => {
      mockFindById.mockResolvedValue(null)

      await expect(service.update(userId, 'nonexistent', { name: 'X' }))
        .rejects.toThrow('Alimento não encontrado')
    })

    it('should throw 403 if food belongs to another user', async () => {
      mockFindById.mockResolvedValue({ _id: 'food-1', userId: 'other-user' })

      await expect(service.update(userId, 'food-1', { name: 'X' }))
        .rejects.toThrow('Acesso negado')
    })
  })

  // ====================================================
  // REMOVE
  // ====================================================

  describe('remove', () => {
    it('should remove a custom food', async () => {
      mockFindById.mockResolvedValue({ _id: 'food-1', userId })
      mockFindByIdAndDelete.mockResolvedValue(null)

      await service.remove(userId, 'food-1')

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('food-1')
    })

    it('should throw NotFoundError if food does not exist', async () => {
      mockFindById.mockResolvedValue(null)

      await expect(service.remove(userId, 'nonexistent'))
        .rejects.toThrow('Alimento não encontrado')
    })

    it('should throw 403 if food belongs to another user', async () => {
      mockFindById.mockResolvedValue({ _id: 'food-1', userId: 'other-user' })

      await expect(service.remove(userId, 'food-1'))
        .rejects.toThrow('Acesso negado')
    })
  })

  // ====================================================
  // GET BY ID
  // ====================================================

  describe('getById', () => {
    it('should return a food by id', async () => {
      const food = { _id: 'food-1', userId, name: 'Panqueca' }
      mockFindById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(food),
      })

      const result = await service.getById('food-1')
      expect(result).toEqual(food)
    })

    it('should return null if not found', async () => {
      mockFindById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      })

      const result = await service.getById('nonexistent')
      expect(result).toBeNull()
    })
  })
})
