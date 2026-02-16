import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DietCacheService } from '../diet-cache.service.js'

// ====================================================
// TESTES DO DIET CACHE SERVICE
// ====================================================
// Testamos a lógica de cache sem precisar de Redis real.
// Usamos mocks para simular o comportamento do Redis.

function createMockRedis(status = 'ready') {
  return {
    status,
    llen: vi.fn(),
    lindex: vi.fn(),
    lpush: vi.fn(),
    ltrim: vi.fn(),
    expire: vi.fn(),
  } as any
}

const fakeDiet = {
  title: 'Dieta Teste',
  meals: [{ name: 'Café', time: '07:00', foods: [], totalCalories: 300 }],
  totalCalories: 300,
  totalProtein: 30,
  totalCarbs: 40,
  totalFat: 10,
  notes: 'Teste',
}

describe('DietCacheService', () => {
  describe('buildKey', () => {
    it('should bucket calories to nearest 50', () => {
      const cache = new DietCacheService(null)
      const key1 = cache.buildKey({ goal: 'LOSE_WEIGHT', adjustedTdee: 1680, restrictions: [] })
      const key2 = cache.buildKey({ goal: 'LOSE_WEIGHT', adjustedTdee: 1720, restrictions: [] })
      expect(key1).toBe(key2)
      expect(key1).toBe('diet:cache:LOSE_WEIGHT:1700:')
    })

    it('should round 1725 up to 1750', () => {
      const cache = new DietCacheService(null)
      const key = cache.buildKey({ goal: 'MAINTAIN', adjustedTdee: 1725, restrictions: [] })
      expect(key).toBe('diet:cache:MAINTAIN:1750:')
    })

    it('should sort and normalize restrictions', () => {
      const cache = new DietCacheService(null)
      const key1 = cache.buildKey({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: ['Lactose', 'Glúten'] })
      const key2 = cache.buildKey({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: ['glúten', 'lactose'] })
      expect(key1).toBe(key2)
    })

    it('should include restrictions in key', () => {
      const cache = new DietCacheService(null)
      const key = cache.buildKey({ goal: 'HEALTH', adjustedTdee: 2000, restrictions: ['glúten'] })
      expect(key).toBe('diet:cache:HEALTH:2000:glúten')
    })

    it('should hash restrictions when more than 5 items', () => {
      const cache = new DietCacheService(null)
      const manyRestrictions = ['a', 'b', 'c', 'd', 'e', 'f']
      const key = cache.buildKey({ goal: 'HEALTH', adjustedTdee: 2000, restrictions: manyRestrictions })
      expect(key).toMatch(/^diet:cache:HEALTH:2000:[a-f0-9]{12}$/)
    })

    it('should produce different keys for different goals', () => {
      const cache = new DietCacheService(null)
      const key1 = cache.buildKey({ goal: 'LOSE_WEIGHT', adjustedTdee: 2000, restrictions: [] })
      const key2 = cache.buildKey({ goal: 'GAIN_MUSCLE', adjustedTdee: 2000, restrictions: [] })
      expect(key1).not.toBe(key2)
    })

    it('should ignore empty/whitespace restrictions', () => {
      const cache = new DietCacheService(null)
      const key1 = cache.buildKey({ goal: 'HEALTH', adjustedTdee: 2000, restrictions: ['', ' ', 'glúten'] })
      const key2 = cache.buildKey({ goal: 'HEALTH', adjustedTdee: 2000, restrictions: ['glúten'] })
      expect(key1).toBe(key2)
    })
  })

  describe('getRandomDiet', () => {
    it('should return null when Redis is null', async () => {
      const cache = new DietCacheService(null)
      const result = await cache.getRandomDiet({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] })
      expect(result).toBeNull()
    })

    it('should return null when Redis status is not ready', async () => {
      const mockRedis = createMockRedis('connecting')
      const cache = new DietCacheService(mockRedis)
      const result = await cache.getRandomDiet({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] })
      expect(result).toBeNull()
    })

    it('should return null when pool is empty', async () => {
      const mockRedis = createMockRedis()
      mockRedis.llen.mockResolvedValue(0)
      const cache = new DietCacheService(mockRedis)
      const result = await cache.getRandomDiet({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] })
      expect(result).toBeNull()
    })

    it('should return null when pool is not full yet (forces AI to fill pool)', async () => {
      const mockRedis = createMockRedis()
      mockRedis.llen.mockResolvedValue(3) // pool tem 3, precisa de 5
      const cache = new DietCacheService(mockRedis)
      const result = await cache.getRandomDiet({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] })
      expect(result).toBeNull()
      // NÃO deve chamar lindex quando pool não está cheio
      expect(mockRedis.lindex).not.toHaveBeenCalled()
    })

    it('should return a parsed diet when pool is full (5 variants)', async () => {
      const mockRedis = createMockRedis()
      mockRedis.llen.mockResolvedValue(5) // pool cheio!
      mockRedis.lindex.mockResolvedValue(JSON.stringify(fakeDiet))
      const cache = new DietCacheService(mockRedis)
      const result = await cache.getRandomDiet({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] })
      expect(result).toEqual(fakeDiet)
    })

    it('should return null on Redis error (graceful degradation)', async () => {
      const mockRedis = createMockRedis()
      mockRedis.llen.mockRejectedValue(new Error('connection lost'))
      const cache = new DietCacheService(mockRedis)
      const result = await cache.getRandomDiet({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] })
      expect(result).toBeNull()
    })
  })

  describe('addToPool', () => {
    it('should LPUSH + LTRIM + EXPIRE on success', async () => {
      const mockRedis = createMockRedis()
      const cache = new DietCacheService(mockRedis, 3600)
      await cache.addToPool({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] }, fakeDiet)

      expect(mockRedis.lpush).toHaveBeenCalledWith(
        'diet:cache:MAINTAIN:2000:',
        JSON.stringify(fakeDiet),
      )
      expect(mockRedis.ltrim).toHaveBeenCalledWith('diet:cache:MAINTAIN:2000:', 0, 4)
      expect(mockRedis.expire).toHaveBeenCalledWith('diet:cache:MAINTAIN:2000:', 3600)
    })

    it('should silently fail on Redis error', async () => {
      const mockRedis = createMockRedis()
      mockRedis.lpush.mockRejectedValue(new Error('write failed'))
      const cache = new DietCacheService(mockRedis)
      await expect(
        cache.addToPool({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] }, fakeDiet),
      ).resolves.toBeUndefined()
    })

    it('should do nothing when Redis is null', async () => {
      const cache = new DietCacheService(null)
      await expect(
        cache.addToPool({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] }, fakeDiet),
      ).resolves.toBeUndefined()
    })

    it('should do nothing when Redis status is not ready', async () => {
      const mockRedis = createMockRedis('connecting')
      const cache = new DietCacheService(mockRedis)
      await cache.addToPool({ goal: 'MAINTAIN', adjustedTdee: 2000, restrictions: [] }, fakeDiet)
      expect(mockRedis.lpush).not.toHaveBeenCalled()
    })
  })
})
