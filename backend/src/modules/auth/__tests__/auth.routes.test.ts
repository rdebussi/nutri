import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buildApp } from '../../../app.js'

// ====================================================
// TESTES DE INTEGRAÇÃO DAS ROTAS DE AUTH
// ====================================================
// Diferente do teste do service (que testa lógica isolada),
// aqui testamos o fluxo HTTP completo:
// Request HTTP → Rota → Validação Zod → Service → Response HTTP
//
// Usamos app.inject() do Fastify, que simula requests HTTP
// sem abrir uma porta TCP real. É rápido e determinístico.

// Mock do Prisma para os testes
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
} as any

const mockHash = vi.fn()
const mockCompare = vi.fn()
const mockSign = vi.fn()

vi.mock('bcryptjs', () => ({
  default: {
    hash: (...args: any[]) => mockHash(...args),
    compare: (...args: any[]) => mockCompare(...args),
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: (...args: any[]) => mockSign(...args),
    verify: vi.fn(),
  },
}))

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/v1/auth/register', () => {
    it('should return 201 with user and tokens on valid input', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockHash.mockResolvedValue('hashed')
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        name: 'Test User',
        role: 'FREE',
        createdAt: new Date(),
      })
      mockSign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'Test@Test.com',
          password: '12345678',
          name: 'Test User',
        },
      })

      expect(response.statusCode).toBe(201)

      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.user.email).toBe('test@test.com') // lowercase!
      expect(body.data.tokens.accessToken).toBe('access_token')
    })

    it('should return 400 on invalid email', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'not-an-email',
          password: '12345678',
          name: 'Test',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 on short password', async () => {
      const app = buildApp({ prisma: mockPrisma })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@test.com',
          password: '123',
          name: 'Test',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 409 when email already exists', async () => {
      const app = buildApp({ prisma: mockPrisma })
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@test.com',
          password: '12345678',
          name: 'Test',
        },
      })

      expect(response.statusCode).toBe(409)
      const body = response.json()
      expect(body.error.message).toBe('Email já cadastrado')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 with tokens on valid credentials', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        password: 'hashed',
        name: 'Test',
        role: 'FREE',
        createdAt: new Date(),
      })
      mockCompare.mockResolvedValue(true)
      mockSign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@test.com',
          password: '12345678',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.success).toBe(true)
      expect(body.data.tokens.accessToken).toBeDefined()
    })

    it('should return 401 on wrong password', async () => {
      const app = buildApp({ prisma: mockPrisma })

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        password: 'hashed',
      })
      mockCompare.mockResolvedValue(false)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@test.com',
          password: 'wrong',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
