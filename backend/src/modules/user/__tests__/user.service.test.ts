import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserService } from '../user.service.js'

// ====================================================
// TESTES DO USER SERVICE
// ====================================================

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  nutritionProfile: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
} as any

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    vi.clearAllMocks()
    userService = new UserService(mockPrisma)
  })

  describe('getProfile', () => {
    it('should return user with profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        name: 'Test',
        role: 'FREE',
        createdAt: new Date(),
        profile: {
          weight: 80,
          height: 180,
          goal: 'LOSE_WEIGHT',
        },
      })

      const result = await userService.getProfile('uuid-1')

      expect(result.email).toBe('test@test.com')
      expect(result.profile?.weight).toBe(80)
      // Garante que a senha nunca é retornada
      expect((result as any).password).toBeUndefined()
    })

    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(userService.getProfile('invalid')).rejects.toThrow(
        'Usuário não encontrado'
      )
    })
  })

  describe('updateProfile', () => {
    it('should upsert nutrition profile', async () => {
      // "upsert" = update + insert. Se o perfil existe, atualiza.
      // Se não existe, cria. É mais prático que checar antes.
      const profileData = {
        weight: 80,
        height: 180,
        goal: 'LOSE_WEIGHT' as const,
      }

      mockPrisma.nutritionProfile.upsert.mockResolvedValue({
        id: 'profile-1',
        userId: 'uuid-1',
        ...profileData,
      })

      const result = await userService.updateProfile('uuid-1', profileData)

      expect(result.weight).toBe(80)
      expect(mockPrisma.nutritionProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'uuid-1' },
        update: profileData,
        create: { userId: 'uuid-1', ...profileData },
      })
    })
  })
})
