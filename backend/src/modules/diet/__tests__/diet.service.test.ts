import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DietService } from '../diet.service.js'

// ====================================================
// TESTES DO DIET SERVICE
// ====================================================
// Aqui testamos a lógica de orquestração:
// - Busca perfil → chama IA → salva no MongoDB
// - Limites de geração por plano
// - Autorização (dieta pertence ao usuário?)

// Mock do Prisma
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
} as any

// Mock do AiService
const mockAiService = {
  generateDiet: vi.fn(),
} as any

// Mock do Mongoose model Diet
// vi.mock() intercepta o import e substitui por um mock
vi.mock('../diet.model.js', () => ({
  Diet: {
    create: vi.fn(),
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        lean: vi.fn(),
      })),
    })),
    findById: vi.fn(() => ({
      lean: vi.fn(),
    })),
    countDocuments: vi.fn(),
  },
}))

// Importa DEPOIS do vi.mock para pegar a versão mockada
import { Diet } from '../diet.model.js'

const fakeDiet = {
  title: 'Dieta Equilíbrio',
  meals: [{ name: 'Café', time: '07:00', foods: [], totalCalories: 300 }],
  totalCalories: 300,
  totalProtein: 30,
  totalCarbs: 40,
  totalFat: 10,
  notes: 'Dica: beba água.',
}

describe('DietService', () => {
  let dietService: DietService

  beforeEach(() => {
    vi.clearAllMocks()
    dietService = new DietService(mockPrisma, mockAiService)
  })

  describe('generate', () => {
    it('should generate and save a diet', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'João',
        role: 'PRO', // PRO = sem limite
        profile: {
          weight: 80,
          height: 180,
          goal: 'LOSE_WEIGHT',
          activityLevel: 'MODERATE',
          restrictions: [],
        },
      })

      mockAiService.generateDiet.mockResolvedValue(fakeDiet)

      const savedDiet = { ...fakeDiet, _id: 'diet-1', userId: 'user-1', goal: 'LOSE_WEIGHT' }
      ;(Diet.create as any).mockResolvedValue(savedDiet)

      const result = await dietService.generate('user-1')

      expect(result.title).toBe('Dieta Equilíbrio')
      expect(mockAiService.generateDiet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João',
          weight: 80,
          goal: 'LOSE_WEIGHT',
        })
      )
    })

    it('should throw 404 if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(dietService.generate('invalid')).rejects.toThrow(
        'Usuário não encontrado'
      )
    })

    it('should enforce generation limits for FREE users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'João',
        role: 'FREE',
        profile: null,
      })

      // Simula que o usuário já gerou 3 dietas este mês
      ;(Diet.countDocuments as any).mockResolvedValue(3)

      await expect(dietService.generate('user-1')).rejects.toThrow(
        'Limite de 3 dietas/mês atingido'
      )
    })

    it('should allow unlimited generation for PRO users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'João',
        role: 'PRO',
        profile: null,
      })

      mockAiService.generateDiet.mockResolvedValue(fakeDiet)
      ;(Diet.create as any).mockResolvedValue({ ...fakeDiet, _id: 'diet-1' })

      // Não deve lançar erro mesmo com muitas dietas
      await expect(dietService.generate('user-1')).resolves.toBeDefined()
      // PRO não checa countDocuments
      expect(Diet.countDocuments).not.toHaveBeenCalled()
    })
  })

  // ====================================================
  // TESTES DE CACHE
  // ====================================================
  describe('generate with cache', () => {
    const mockCache = {
      getRandomDiet: vi.fn(),
      addToPool: vi.fn(),
    }

    const userWithProfile = {
      id: 'user-1',
      name: 'João',
      role: 'PRO',
      profile: {
        id: 'profile-1',
        weight: 80,
        height: 180,
        goal: 'LOSE_WEIGHT',
        activityLevel: 'MODERATE',
        restrictions: [],
        gender: 'MALE',
        birthDate: new Date('1990-01-01'),
      },
    }

    beforeEach(() => {
      mockCache.getRandomDiet.mockReset()
      mockCache.addToPool.mockReset()
      mockPrisma.exerciseRoutine = { findMany: vi.fn().mockResolvedValue([]) }
    })

    it('should return cached diet without calling AI (cache hit)', async () => {
      const cachedService = new DietService(mockPrisma, mockAiService, mockCache as any)

      mockPrisma.user.findUnique.mockResolvedValue(userWithProfile)
      mockCache.getRandomDiet.mockResolvedValue(fakeDiet)
      ;(Diet.create as any).mockResolvedValue({ ...fakeDiet, _id: 'diet-1', userId: 'user-1' })

      await cachedService.generate('user-1')

      // IA NÃO deve ser chamada
      expect(mockAiService.generateDiet).not.toHaveBeenCalled()
      // Cache foi consultado
      expect(mockCache.getRandomDiet).toHaveBeenCalledWith(
        expect.objectContaining({ goal: 'LOSE_WEIGHT' }),
      )
      // Diet.create DEVE ser chamado (cada user tem sua cópia)
      expect(Diet.create).toHaveBeenCalled()
    })

    it('should call AI and populate cache on cache miss', async () => {
      const cachedService = new DietService(mockPrisma, mockAiService, mockCache as any)

      mockPrisma.user.findUnique.mockResolvedValue(userWithProfile)
      mockCache.getRandomDiet.mockResolvedValue(null)
      mockAiService.generateDiet.mockResolvedValue(fakeDiet)
      ;(Diet.create as any).mockResolvedValue({ ...fakeDiet, _id: 'diet-1', userId: 'user-1' })

      await cachedService.generate('user-1')

      // IA DEVE ser chamada
      expect(mockAiService.generateDiet).toHaveBeenCalled()
      // Cache deve ser populado
      expect(mockCache.addToPool).toHaveBeenCalledWith(
        expect.objectContaining({ goal: 'LOSE_WEIGHT' }),
        fakeDiet,
      )
    })

    it('should work without cache (backwards compatible)', async () => {
      // DietService SEM terceiro parâmetro
      const noCacheService = new DietService(mockPrisma, mockAiService)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'João',
        role: 'PRO',
        profile: null,
      })

      mockAiService.generateDiet.mockResolvedValue(fakeDiet)
      ;(Diet.create as any).mockResolvedValue({ ...fakeDiet, _id: 'diet-1' })

      await expect(noCacheService.generate('user-1')).resolves.toBeDefined()
    })

    it('should skip cache when adjustedTdee is null (no profile)', async () => {
      const cachedService = new DietService(mockPrisma, mockAiService, mockCache as any)

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'João',
        role: 'PRO',
        profile: null, // sem perfil = sem TDEE
      })

      mockAiService.generateDiet.mockResolvedValue(fakeDiet)
      ;(Diet.create as any).mockResolvedValue({ ...fakeDiet, _id: 'diet-1' })

      await cachedService.generate('user-1')

      // Cache NÃO deve ser consultado (sem TDEE)
      expect(mockCache.getRandomDiet).not.toHaveBeenCalled()
      // IA deve ser chamada direto
      expect(mockAiService.generateDiet).toHaveBeenCalled()
    })
  })
})
