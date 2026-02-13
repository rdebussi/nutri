import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../auth.service.js'

// ====================================================
// TESTES DO AUTH SERVICE
// ====================================================
// Seguindo TDD: escrevemos estes testes ANTES do código.
// Cada "it" descreve um comportamento esperado.
//
// vi.fn() → cria uma "função falsa" (mock).
// Por que mockar? Porque no teste unitário, queremos
// testar APENAS o AuthService, sem depender do banco
// de dados real ou do bcrypt real. Isolamos o que testamos.

// Mock do Prisma (simula o banco de dados)
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
} as any

// Mock do bcrypt (simula hash de senha)
const mockHash = vi.fn()
const mockCompare = vi.fn()

vi.mock('bcryptjs', () => ({
  default: {
    hash: (...args: any[]) => mockHash(...args),
    compare: (...args: any[]) => mockCompare(...args),
  },
}))

// Mock do jsonwebtoken (simula geração de tokens)
const mockSign = vi.fn()
const mockVerify = vi.fn()

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: (...args: any[]) => mockSign(...args),
    verify: (...args: any[]) => mockVerify(...args),
  },
}))

describe('AuthService', () => {
  let authService: AuthService

  // beforeEach → roda ANTES de cada teste.
  // Limpa todos os mocks para garantir que um teste
  // não interfere no outro (isolamento).
  beforeEach(() => {
    vi.clearAllMocks()
    authService = new AuthService(mockPrisma)
  })

  // ==================
  // REGISTER
  // ==================
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      // Arrange (preparar)
      const input = { email: 'test@test.com', password: '12345678', name: 'Test User' }
      mockHash.mockResolvedValue('hashed_password')
      mockPrisma.user.findUnique.mockResolvedValue(null) // email não existe
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

      // Act (agir)
      const result = await authService.register(input)

      // Assert (verificar)
      expect(result.user.email).toBe('test@test.com')
      expect(result.tokens.accessToken).toBe('access_token')
      expect(result.tokens.refreshToken).toBe('refresh_token')
      // Garante que o bcrypt foi chamado com a senha e 12 salt rounds
      expect(mockHash).toHaveBeenCalledWith('12345678', 12)
      // Garante que NUNCA guardamos a senha em texto puro
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: 'hashed_password' }),
        })
      )
    })

    it('should throw if email already exists', async () => {
      const input = { email: 'test@test.com', password: '12345678', name: 'Test' }
      // Simula que já existe um usuário com esse email
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' })

      await expect(authService.register(input)).rejects.toThrow('Email já cadastrado')
    })
  })

  // ==================
  // LOGIN
  // ==================
  describe('login', () => {
    it('should return tokens when credentials are valid', async () => {
      const input = { email: 'test@test.com', password: '12345678' }
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        password: 'hashed_password',
        name: 'Test User',
        role: 'FREE',
        createdAt: new Date(),
      })
      mockCompare.mockResolvedValue(true) // senha confere
      mockSign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token')

      const result = await authService.login(input)

      expect(result.user.email).toBe('test@test.com')
      expect(result.tokens.accessToken).toBeDefined()
      // Garante que a resposta NUNCA inclui a senha
      expect((result.user as any).password).toBeUndefined()
    })

    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(
        authService.login({ email: 'no@no.com', password: '12345678' })
      ).rejects.toThrow('Credenciais inválidas')
    })

    it('should throw if password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        password: 'hashed_password',
      })
      mockCompare.mockResolvedValue(false) // senha NÃO confere

      await expect(
        authService.login({ email: 'test@test.com', password: 'wrong' })
      ).rejects.toThrow('Credenciais inválidas')
    })

    // SEGURANÇA: a mensagem de erro é a mesma para "user não existe"
    // e "senha errada". Se fosse diferente, um atacante saberia
    // quais emails estão cadastrados (enumeração de usuários).
  })
})
