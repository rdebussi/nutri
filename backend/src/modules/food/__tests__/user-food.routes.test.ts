import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildApp } from '../../../app.js'

// ====================================================
// TESTES DE INTEGRAÇÃO DAS ROTAS DE USER FOOD
// ====================================================
// POST   /api/v1/foods/custom       → criar alimento
// GET    /api/v1/foods/custom       → listar meus alimentos
// PUT    /api/v1/foods/custom/:id   → editar alimento
// DELETE /api/v1/foods/custom/:id   → remover alimento

const mockPrisma = {} as any

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('test-token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-123' }),
  },
}))

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

const validFood = {
  name: 'Panqueca de aveia',
  category: 'grains',
  caloriesPer100g: 250,
  proteinPer100g: 10,
  carbsPer100g: 30,
  fatPer100g: 8,
}

const savedFood = {
  _id: 'food-1',
  userId: 'user-123',
  ...validFood,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('User Food Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ====================================================
  // POST /api/v1/foods/custom
  // ====================================================

  describe('POST /api/v1/foods/custom', () => {
    it('should create a custom food — 201', async () => {
      const app = buildApp({ prisma: mockPrisma })
      mockCreate.mockResolvedValue(savedFood)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/foods/custom',
        headers: { authorization: 'Bearer test-token' },
        payload: validFood,
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Panqueca de aveia')
    })

    it('should create a food with per-serving macros — 201', async () => {
      const app = buildApp({ prisma: mockPrisma })
      mockCreate.mockImplementation((data: any) => Promise.resolve({ _id: 'food-2', ...data }))

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/foods/custom',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Panqueca de aveia',
          category: 'grains',
          servingSize: 80,
          servingName: '1 panqueca',
          caloriesPerServing: 200,
          proteinPerServing: 8,
          carbsPerServing: 24,
          fatPerServing: 6.4,
        },
      })

      expect(response.statusCode).toBe(201)
    })

    it('should return 401 without auth token', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/foods/custom',
        payload: validFood,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 400 with missing name', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/foods/custom',
        headers: { authorization: 'Bearer test-token' },
        payload: { category: 'grains' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 without macros (per-100g or per-serving)', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/foods/custom',
        headers: { authorization: 'Bearer test-token' },
        payload: {
          name: 'Alimento sem macros',
          category: 'others',
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })

  // ====================================================
  // GET /api/v1/foods/custom
  // ====================================================

  describe('GET /api/v1/foods/custom', () => {
    it('should list user custom foods — 200', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([savedFood]),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods/custom',
        headers: { authorization: 'Bearer test-token' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Panqueca de aveia')
    })

    it('should filter by search and category', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods/custom?search=panqueca&category=grains',
        headers: { authorization: 'Bearer test-token' },
      })

      expect(response.statusCode).toBe(200)
      expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-123',
        category: 'grains',
        name: expect.any(RegExp),
      }))
    })

    it('should return 401 without auth token', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods/custom',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ====================================================
  // PUT /api/v1/foods/custom/:id
  // ====================================================

  describe('PUT /api/v1/foods/custom/:id', () => {
    it('should update a custom food — 200', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFindById.mockResolvedValue({ _id: 'food-1', userId: 'user-123' })
      mockFindByIdAndUpdate.mockResolvedValue({
        ...savedFood,
        name: 'Panqueca fitness',
      })

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/foods/custom/food-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Panqueca fitness' },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data.name).toBe('Panqueca fitness')
    })

    it('should return 404 if food does not exist', async () => {
      const app = buildApp({ prisma: mockPrisma })
      mockFindById.mockResolvedValue(null)

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/foods/custom/nonexistent',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Alimento teste' },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 403 if food belongs to another user', async () => {
      const app = buildApp({ prisma: mockPrisma })
      mockFindById.mockResolvedValue({ _id: 'food-1', userId: 'other-user' })

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/foods/custom/food-1',
        headers: { authorization: 'Bearer test-token' },
        payload: { name: 'Alimento teste' },
      })

      expect(response.statusCode).toBe(403)
    })
  })

  // ====================================================
  // DELETE /api/v1/foods/custom/:id
  // ====================================================

  describe('DELETE /api/v1/foods/custom/:id', () => {
    it('should delete a custom food — 204', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFindById.mockResolvedValue({ _id: 'food-1', userId: 'user-123' })
      mockFindByIdAndDelete.mockResolvedValue(null)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/foods/custom/food-1',
        headers: { authorization: 'Bearer test-token' },
      })

      expect(response.statusCode).toBe(204)
    })

    it('should return 404 if food does not exist', async () => {
      const app = buildApp({ prisma: mockPrisma })
      mockFindById.mockResolvedValue(null)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/foods/custom/nonexistent',
        headers: { authorization: 'Bearer test-token' },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 403 if food belongs to another user', async () => {
      const app = buildApp({ prisma: mockPrisma })
      mockFindById.mockResolvedValue({ _id: 'food-1', userId: 'other-user' })

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/foods/custom/food-1',
        headers: { authorization: 'Bearer test-token' },
      })

      expect(response.statusCode).toBe(403)
    })
  })
})
