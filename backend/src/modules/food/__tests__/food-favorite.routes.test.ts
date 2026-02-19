import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildApp } from '../../../app.js'

// ====================================================
// TESTES DE INTEGRAÇÃO DAS ROTAS DE FAVORITOS
// ====================================================

const mockPrisma = {} as any

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('test-token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-123' }),
  },
}))

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
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
    }),
  },
  FOOD_CATEGORIES: [
    'grains', 'proteins', 'dairy', 'fruits', 'vegetables',
    'legumes', 'fats', 'beverages', 'sweets', 'others',
  ],
}))

// Mock do UserFood model
vi.mock('../user-food.model.js', () => ({
  UserFood: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}))

describe('Food Favorite Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ====================================================
  // POST /api/v1/foods/favorites — toggle
  // ====================================================

  describe('POST /api/v1/foods/favorites', () => {
    it('should add a favorite — 200', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFindOne.mockResolvedValue(null)
      mockCreate.mockResolvedValue({ _id: 'fav-1', userId: 'user-123', foodId: 'food-1', foodSource: 'database' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/foods/favorites',
        headers: { authorization: 'Bearer test-token' },
        payload: { foodId: 'food-1', foodSource: 'database' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.favorited).toBe(true)
    })

    it('should remove a favorite when toggled again — 200', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFindOne.mockResolvedValue({ _id: 'fav-1' })
      mockFindByIdAndDelete.mockResolvedValue(null)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/foods/favorites',
        headers: { authorization: 'Bearer test-token' },
        payload: { foodId: 'food-1', foodSource: 'database' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.favorited).toBe(false)
    })

    it('should return 401 without auth', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/foods/favorites',
        payload: { foodId: 'food-1', foodSource: 'database' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 400 with invalid foodSource', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/foods/favorites',
        headers: { authorization: 'Bearer test-token' },
        payload: { foodId: 'food-1', foodSource: 'invalid' },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  // ====================================================
  // GET /api/v1/foods/favorites
  // ====================================================

  describe('GET /api/v1/foods/favorites', () => {
    it('should return populated favorites — 200', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFavFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: 'fav-1', userId: 'user-123', foodId: 'food-1', foodSource: 'database' },
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

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods/favorites',
        headers: { authorization: 'Bearer test-token' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].food.name).toBe('Arroz branco')
    })

    it('should return 401 without auth', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods/favorites',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ====================================================
  // DELETE /api/v1/foods/favorites/:foodId
  // ====================================================

  describe('DELETE /api/v1/foods/favorites/:foodId', () => {
    it('should remove a favorite — 204', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFindOne.mockResolvedValue({ _id: 'fav-1' })
      mockFindByIdAndDelete.mockResolvedValue(null)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/foods/favorites/food-1',
        headers: { authorization: 'Bearer test-token' },
      })

      expect(response.statusCode).toBe(204)
    })
  })
})
