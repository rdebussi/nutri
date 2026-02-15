import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildApp } from '../../../app.js'

// ====================================================
// TESTES DE INTEGRAÇÃO DAS ROTAS DE EXERCÍCIOS
// ====================================================
// GET /api/v1/exercises — listar exercícios da base
//
// Essa rota é PÚBLICA (não precisa de auth).
// O frontend usa para montar a tela de rotina semanal,
// onde o usuário escolhe quais exercícios faz.

const mockPrisma = {} as any

// Mock do Exercise model (MongoDB)
const mockFind = vi.fn()
const mockCountDocuments = vi.fn()

vi.mock('../exercise.model.js', () => ({
  Exercise: {
    find: (...args: any[]) => mockFind(...args),
    countDocuments: (...args: any[]) => mockCountDocuments(...args),
  },
}))

describe('Exercise Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ====================================================
  // GET /api/v1/exercises
  // ====================================================

  describe('GET /api/v1/exercises', () => {
    const mockExercises = [
      { _id: '1', name: 'Musculação', category: 'strength', met: 6.0 },
      { _id: '2', name: 'Corrida', category: 'cardio', met: 8.0 },
      { _id: '3', name: 'Yoga', category: 'flexibility', met: 3.0 },
    ]

    it('should return all exercises', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockExercises),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/exercises',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(3)
      expect(body.data[0].name).toBe('Musculação')
    })

    it('should filter exercises by category', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const cardioOnly = [mockExercises[1]]
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(cardioOnly),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/exercises?category=cardio',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].category).toBe('cardio')
      // Verifica que o filtro foi passado corretamente
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'cardio' }),
      )
    })

    it('should search exercises by name (case insensitive)', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const matched = [mockExercises[0]]
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(matched),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/exercises?search=muscu',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toHaveLength(1)
      // Verifica que regex case-insensitive foi usada
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
        url: '/api/v1/exercises?search=corrida&category=cardio',
      })

      expect(response.statusCode).toBe(200)
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'cardio',
          name: expect.any(RegExp),
        }),
      )
    })

    it('should return empty array when no exercises match', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/exercises?search=xyzinexistente',
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
        url: '/api/v1/exercises?category=invalid',
      })

      expect(response.statusCode).toBe(400)
    })
  })
})
