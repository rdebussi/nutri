import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildApp } from '../../../app.js'

// ====================================================
// TESTES DE INTEGRAÇÃO DAS ROTAS DE CHECK-IN
// ====================================================
// Testamos o fluxo HTTP completo:
// Request → Rota → Validação → Service → Response
//
// Mockamos: Prisma (PostgreSQL), JWT (auth), Mongoose models

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
} as any

// Mock JWT para autenticação
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('test-token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-123' }),
  },
}))

// Mock do CheckIn model
const mockFindOneAndUpdate = vi.fn()
const mockFindOne = vi.fn()
const mockFind = vi.fn()

vi.mock('../checkin.model.js', () => ({
  CheckIn: {
    findOneAndUpdate: (...args: any[]) => mockFindOneAndUpdate(...args),
    findOne: (...args: any[]) => mockFindOne(...args),
    find: (...args: any[]) => mockFind(...args),
  },
}))

// Mock do Diet model
const mockDietFindById = vi.fn()

vi.mock('../../diet/diet.model.js', () => ({
  Diet: {
    findById: (...args: any[]) => mockDietFindById(...args),
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

describe('CheckIn Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const authHeaders = {
    authorization: 'Bearer test-token',
  }

  // ====================================================
  // POST /api/v1/check-ins
  // ====================================================

  describe('POST /api/v1/check-ins', () => {
    const validPayload = {
      dietId: 'diet-456',
      date: '2026-02-15',
      meals: [
        { mealName: 'Café da manhã', completed: true },
        { mealName: 'Almoço', completed: false },
      ],
    }

    it('should return 201 on valid check-in creation', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockDietFindById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: 'diet-456', userId: 'user-123' }),
      })
      mockFindOneAndUpdate.mockResolvedValue({
        _id: 'checkin-789',
        userId: 'user-123',
        ...validPayload,
        adherenceRate: 50,
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/check-ins',
        payload: validPayload,
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.adherenceRate).toBe(50)
    })

    it('should return 401 without auth token', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/check-ins',
        payload: validPayload,
      })

      expect(response.statusCode).toBe(401)
    })

    it('should return 400 on invalid body (missing meals)', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/check-ins',
        payload: { dietId: 'diet-456' },
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 on invalid date format', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/check-ins',
        payload: { ...validPayload, date: '15/02/2026' },
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 404 when diet not found', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockDietFindById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/check-ins',
        payload: validPayload,
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ====================================================
  // GET /api/v1/check-ins
  // ====================================================

  describe('GET /api/v1/check-ins', () => {
    it('should return 200 with check-in for specific date', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const mockCheckIn = {
        _id: 'checkin-789',
        userId: 'user-123',
        adherenceRate: 75,
        meals: [{ mealName: 'Café', completed: true }],
      }
      mockFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockCheckIn) })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/check-ins?date=2026-02-15',
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.adherenceRate).toBe(75)
    })

    it('should return 200 with null when no check-in exists', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockFindOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/check-ins?date=2026-02-15',
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toBeNull()
    })

    it('should return 401 without auth token', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/check-ins',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ====================================================
  // GET /api/v1/check-ins/stats
  // ====================================================

  describe('GET /api/v1/check-ins/stats', () => {
    it('should return 200 with weekly stats', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const mockCheckIns = [
        { date: new Date('2026-02-15'), adherenceRate: 80, meals: [{ completed: true }, { completed: false }] },
      ]
      mockFind.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockCheckIns),
        }),
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/check-ins/stats',
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.weeklyStats).toBeDefined()
      expect(body.data.streak).toBeDefined()
      expect(body.data.averageAdherence).toBeDefined()
    })

    it('should return 401 without auth token', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/check-ins/stats',
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
