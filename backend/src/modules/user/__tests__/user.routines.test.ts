import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildApp } from '../../../app.js'

// ====================================================
// TESTES DE INTEGRAÇÃO — ROTINA DE EXERCÍCIOS
// ====================================================
// GET  /users/me/routines  → listar rotina semanal
// PUT  /users/me/routines  → salvar rotina inteira (replace)
// GET  /users/me/tdee      → calcular TDEE baseado no perfil + rotina
//
// Todas as rotas são protegidas (precisam de auth).

// Mock do Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  nutritionProfile: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  exerciseRoutine: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn(),
} as any

// Mock JWT
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('test-token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-123' }),
  },
}))

// Mock Exercise model (MongoDB — não usado diretamente aqui, mas o app registra as rotas)
vi.mock('../../exercise/exercise.model.js', () => ({
  Exercise: {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}))

// Mock CheckIn model (mesmo motivo)
vi.mock('../../checkin/checkin.model.js', () => ({
  CheckIn: {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  },
}))

// Mock Diet model
vi.mock('../../diet/diet.model.js', () => ({
  Diet: {
    findById: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    countDocuments: vi.fn(),
  },
}))

describe('User Routines & TDEE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const authHeaders = {
    authorization: 'Bearer test-token',
  }

  // ====================================================
  // GET /api/v1/users/me/routines
  // ====================================================

  describe('GET /api/v1/users/me/routines', () => {
    it('should return user exercise routines', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const mockProfile = { id: 'profile-1', userId: 'user-123' }
      mockPrisma.nutritionProfile.findUnique.mockResolvedValue(mockProfile)

      const mockRoutines = [
        {
          id: 'r1',
          profileId: 'profile-1',
          exerciseName: 'Musculação',
          category: 'strength',
          met: 6.0,
          daysPerWeek: 4,
          durationMinutes: 60,
          intensity: 'MODERATE',
        },
        {
          id: 'r2',
          profileId: 'profile-1',
          exerciseName: 'Corrida',
          category: 'cardio',
          met: 8.0,
          daysPerWeek: 2,
          durationMinutes: 30,
          intensity: 'MODERATE',
        },
      ]
      mockPrisma.exerciseRoutine.findMany.mockResolvedValue(mockRoutines)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/routines',
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(2)
      expect(body.data[0].exerciseName).toBe('Musculação')
    })

    it('should return empty array when no routines exist', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockPrisma.nutritionProfile.findUnique.mockResolvedValue({ id: 'profile-1' })
      mockPrisma.exerciseRoutine.findMany.mockResolvedValue([])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/routines',
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.data).toHaveLength(0)
    })

    it('should return 404 when user has no profile', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockPrisma.nutritionProfile.findUnique.mockResolvedValue(null)

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/routines',
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 401 without auth', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/routines',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ====================================================
  // PUT /api/v1/users/me/routines
  // ====================================================

  describe('PUT /api/v1/users/me/routines', () => {
    const validRoutines = [
      {
        exerciseName: 'Musculação',
        category: 'strength',
        met: 6.0,
        daysPerWeek: 4,
        durationMinutes: 60,
        intensity: 'MODERATE',
      },
    ]

    it('should replace all routines', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const mockProfile = { id: 'profile-1', userId: 'user-123' }
      mockPrisma.nutritionProfile.findUnique.mockResolvedValue(mockProfile)

      // $transaction recebe uma função callback
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        return fn(mockPrisma)
      })
      mockPrisma.exerciseRoutine.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.exerciseRoutine.createMany.mockResolvedValue({ count: 1 })
      mockPrisma.exerciseRoutine.findMany.mockResolvedValue(
        validRoutines.map((r, i) => ({ id: `r${i}`, profileId: 'profile-1', ...r })),
      )

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/routines',
        headers: authHeaders,
        payload: { routines: validRoutines },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(1)
    })

    it('should return 400 on invalid intensity', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/routines',
        headers: authHeaders,
        payload: {
          routines: [{
            exerciseName: 'Corrida',
            category: 'cardio',
            met: 8.0,
            daysPerWeek: 3,
            durationMinutes: 30,
            intensity: 'SUPER_INTENSE', // inválido
          }],
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when daysPerWeek > 7', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/routines',
        headers: authHeaders,
        payload: {
          routines: [{
            exerciseName: 'Corrida',
            category: 'cardio',
            met: 8.0,
            daysPerWeek: 10, // impossível
            durationMinutes: 30,
            intensity: 'MODERATE',
          }],
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 404 when user has no profile', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockPrisma.nutritionProfile.findUnique.mockResolvedValue(null)

      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/routines',
        headers: authHeaders,
        payload: { routines: validRoutines },
      })

      expect(response.statusCode).toBe(404)
    })
  })

  // ====================================================
  // GET /api/v1/users/me/tdee
  // ====================================================

  describe('GET /api/v1/users/me/tdee', () => {
    it('should calculate TDEE based on profile and routines', async () => {
      const app = buildApp({ prisma: mockPrisma })

      // Perfil com dados completos
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        profile: {
          id: 'profile-1',
          weight: 80,
          height: 175,
          birthDate: new Date('1996-02-15'),
          gender: 'MALE',
          goal: 'GAIN_MUSCLE',
        },
      })

      // Rotina semanal
      mockPrisma.exerciseRoutine.findMany.mockResolvedValue([
        {
          exerciseName: 'Musculação',
          category: 'strength',
          met: 6.0,
          daysPerWeek: 4,
          durationMinutes: 60,
          intensity: 'MODERATE',
        },
      ])

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/tdee',
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.bmr).toBeGreaterThan(0)
      expect(body.data.tdee).toBeGreaterThan(0)
      expect(body.data.adjustedTdee).toBeGreaterThan(0)
      expect(body.data.goal).toBe('GAIN_MUSCLE')
    })

    it('should return 400 when profile is incomplete', async () => {
      const app = buildApp({ prisma: mockPrisma })

      // Perfil sem peso/altura
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        profile: {
          id: 'profile-1',
          weight: null,
          height: null,
          birthDate: null,
          gender: null,
        },
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/tdee',
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 404 when user has no profile', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        profile: null,
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/tdee',
        headers: authHeaders,
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 401 without auth', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/tdee',
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
