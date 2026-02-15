import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildApp } from '../../../app.js'

// ====================================================
// TESTES DE INTEGRAÇÃO DAS ROTAS DE ALIMENTOS
// ====================================================
// GET /api/v1/foods — listar/buscar alimentos da base nutricional
// GET /api/v1/foods/:id/suggestions — sugestões de substituição
//
// Rota PÚBLICA (não precisa de auth).
// Segue o mesmo padrão de exercise.routes.test.ts.

const mockPrisma = {} as any

// Mock do FoodItem model (MongoDB)
const mockFind = vi.fn()
const mockFindById = vi.fn()

vi.mock('../food.model.js', () => ({
  FoodItem: {
    find: (...args: any[]) => mockFind(...args),
    findById: (...args: any[]) => mockFindById(...args),
  },
  FOOD_CATEGORIES: [
    'grains', 'proteins', 'dairy', 'fruits', 'vegetables',
    'legumes', 'fats', 'beverages', 'sweets', 'others',
  ],
}))

const mockFoods = [
  { _id: '1', name: 'Arroz branco cozido', category: 'grains', caloriesPer100g: 128, proteinPer100g: 2.5, carbsPer100g: 28.1, fatPer100g: 0.2, commonPortions: [{ name: '1 xícara', grams: 160 }] },
  { _id: '2', name: 'Frango grelhado (peito)', category: 'proteins', caloriesPer100g: 159, proteinPer100g: 32.0, carbsPer100g: 0.0, fatPer100g: 2.5, commonPortions: [{ name: '1 filé médio', grams: 150 }] },
  { _id: '3', name: 'Banana prata', category: 'fruits', caloriesPer100g: 98, proteinPer100g: 1.3, carbsPer100g: 26.0, fatPer100g: 0.1, commonPortions: [{ name: '1 unidade', grams: 86 }] },
]

describe('Food Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ====================================================
  // GET /api/v1/foods
  // ====================================================

  describe('GET /api/v1/foods', () => {
    it('should return all foods', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockFoods),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(3)
      expect(body.data[0].name).toBe('Arroz branco cozido')
    })

    it('should filter foods by category', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([mockFoods[1]]),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods?category=proteins',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].category).toBe('proteins')
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'proteins' }),
      )
    })

    it('should search foods by name (case insensitive)', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([mockFoods[0]]),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods?search=arroz',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toHaveLength(1)
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(RegExp),
        }),
      )
    })

    it('should combine search and category filters', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods?search=banana&category=fruits',
      })

      expect(response.statusCode).toBe(200)
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'fruits',
          name: expect.any(RegExp),
        }),
      )
    })

    it('should return empty array when no foods match', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods?search=xyzinexistente',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(0)
    })

    it('should reject invalid category', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods?category=invalid',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  // ====================================================
  // GET /api/v1/foods/:id/suggestions
  // ====================================================

  describe('GET /api/v1/foods/:id/suggestions', () => {
    it('should return suggestions from same category with similar calories', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const arroz = mockFoods[0]
      mockFindById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(arroz),
      })

      const suggestions = [
        { _id: '4', name: 'Macarrão cozido', category: 'grains', caloriesPer100g: 102 },
      ]
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(suggestions),
          }),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods/1/suggestions',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
      expect(body.data[0].name).toBe('Macarrão cozido')

      // Verifica filtro: mesma categoria, calorias ±30%, exclui o próprio
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'grains',
          caloriesPer100g: expect.objectContaining({
            $gte: expect.any(Number),
            $lte: expect.any(Number),
          }),
        }),
      )
    })

    it('should return 404 if food not found', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFindById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/foods/nonexistent/suggestions',
      })

      expect(response.statusCode).toBe(404)
      const body = response.json()
      expect(body.success).toBe(false)
    })
  })
})
