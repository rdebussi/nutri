import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FoodFavoriteService } from '../food-favorite.service.js'

// ====================================================
// TESTES DO FOOD FAVORITE SERVICE
// ====================================================

// Mock do FoodFavorite model
const mockCreate = vi.fn()
const mockFindOne = vi.fn()
const mockFindByIdAndDelete = vi.fn()
const mockFavFind = vi.fn()

vi.mock('../food-favorite.model.js', () => ({
  FoodFavorite: {
    create: (...args: any[]) => mockCreate(...args),
    findOne: (...args: any[]) => mockFindOne(...args),
    findByIdAndDelete: (...args: any[]) => mockFindByIdAndDelete(...args),
    find: (...args: any[]) => mockFavFind(...args),
  },
}))

// Mock do FoodItem model
const mockFoodItemFindById = vi.fn()

vi.mock('../food.model.js', () => ({
  FoodItem: {
    findById: (...args: any[]) => mockFoodItemFindById(...args),
  },
  FOOD_CATEGORIES: [
    'grains', 'proteins', 'dairy', 'fruits', 'vegetables',
    'legumes', 'fats', 'beverages', 'sweets', 'others',
  ],
}))

// Mock do UserFood model
const mockUserFoodFindById = vi.fn()

vi.mock('../user-food.model.js', () => ({
  UserFood: {
    findById: (...args: any[]) => mockUserFoodFindById(...args),
  },
}))

const userId = 'user-123'

describe('FoodFavoriteService', () => {
  let service: FoodFavoriteService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new FoodFavoriteService()
  })

  // ====================================================
  // TOGGLE
  // ====================================================

  describe('toggle', () => {
    it('should add a favorite when it does not exist', async () => {
      mockFindOne.mockResolvedValue(null)
      mockCreate.mockResolvedValue({ _id: 'fav-1', userId, foodId: 'food-1', foodSource: 'database' })

      const result = await service.toggle(userId, 'food-1', 'database')

      expect(result.favorited).toBe(true)
      expect(mockCreate).toHaveBeenCalledWith({ userId, foodId: 'food-1', foodSource: 'database' })
    })

    it('should remove a favorite when it already exists', async () => {
      mockFindOne.mockResolvedValue({ _id: 'fav-1', userId, foodId: 'food-1' })
      mockFindByIdAndDelete.mockResolvedValue(null)

      const result = await service.toggle(userId, 'food-1', 'database')

      expect(result.favorited).toBe(false)
      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('fav-1')
    })

    it('should toggle custom food favorites', async () => {
      mockFindOne.mockResolvedValue(null)
      mockCreate.mockResolvedValue({ _id: 'fav-2', userId, foodId: 'custom-1', foodSource: 'custom' })

      const result = await service.toggle(userId, 'custom-1', 'custom')

      expect(result.favorited).toBe(true)
      expect(mockCreate).toHaveBeenCalledWith({ userId, foodId: 'custom-1', foodSource: 'custom' })
    })
  })

  // ====================================================
  // LIST
  // ====================================================

  describe('list', () => {
    it('should return populated favorites from database source', async () => {
      mockFavFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: 'fav-1', userId, foodId: 'food-1', foodSource: 'database' },
          ]),
        }),
      })

      mockFoodItemFindById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: 'food-1',
            name: 'Arroz branco',
            category: 'grains',
            caloriesPer100g: 128,
            proteinPer100g: 2.5,
            carbsPer100g: 28.1,
            fatPer100g: 0.2,
          }),
        }),
      })

      const result = await service.list(userId)

      expect(result).toHaveLength(1)
      expect(result[0].food).not.toBeNull()
      expect(result[0].food!.name).toBe('Arroz branco')
      expect(result[0].foodSource).toBe('database')
    })

    it('should return populated favorites from custom source', async () => {
      mockFavFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: 'fav-2', userId, foodId: 'custom-1', foodSource: 'custom' },
          ]),
        }),
      })

      mockUserFoodFindById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: 'custom-1',
            name: 'Panqueca de aveia',
            category: 'grains',
            caloriesPer100g: 250,
            proteinPer100g: 10,
            carbsPer100g: 30,
            fatPer100g: 8,
          }),
        }),
      })

      const result = await service.list(userId)

      expect(result).toHaveLength(1)
      expect(result[0].food!.name).toBe('Panqueca de aveia')
      expect(result[0].foodSource).toBe('custom')
    })

    it('should handle deleted foods gracefully (food = null)', async () => {
      mockFavFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: 'fav-3', userId, foodId: 'deleted-food', foodSource: 'database' },
          ]),
        }),
      })

      mockFoodItemFindById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null),
        }),
      })

      const result = await service.list(userId)

      expect(result).toHaveLength(1)
      expect(result[0].food).toBeNull()
    })

    it('should return empty array when no favorites', async () => {
      mockFavFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await service.list(userId)
      expect(result).toHaveLength(0)
    })
  })

  // ====================================================
  // GET FAVORITE IDS
  // ====================================================

  describe('getFavoriteIds', () => {
    it('should return a Set of favorited foodIds', async () => {
      mockFavFind.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { foodId: 'food-1' },
            { foodId: 'food-2' },
            { foodId: 'custom-1' },
          ]),
        }),
      })

      const result = await service.getFavoriteIds(userId)

      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(3)
      expect(result.has('food-1')).toBe(true)
      expect(result.has('custom-1')).toBe(true)
      expect(result.has('nonexistent')).toBe(false)
    })

    it('should return empty Set when no favorites', async () => {
      mockFavFind.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await service.getFavoriteIds(userId)
      expect(result.size).toBe(0)
    })
  })
})
