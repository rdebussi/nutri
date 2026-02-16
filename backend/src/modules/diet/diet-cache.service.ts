import type Redis from 'ioredis'
import { createHash } from 'crypto'

// ====================================================
// DIET CACHE SERVICE
// ====================================================
// Cache inteligente para dietas geradas por IA.
//
// Usuários com perfis nutricionais equivalentes (mesmo TDEE
// ajustado, objetivo e restrições) compartilham dietas cacheadas.
// Isso reduz drasticamente as chamadas ao Gemini.
//
// Estratégia:
// 1. TDEE é arredondado para o múltiplo de 50 mais próximo ("bucket")
//    → 1680 e 1720 viram 1700 (diferença de 25 kcal = irrelevante)
// 2. Cache key = goal + bucket + restrições normalizadas
// 3. Cada key armazena um POOL de até 5 variantes (Redis List)
// 4. Na leitura, uma variante aleatória é selecionada
// 5. TTL de 6h garante renovação natural do pool
//
// Se Redis estiver fora, tudo funciona normalmente (graceful degradation).

export type CacheKeyInput = {
  goal: string
  adjustedTdee: number
  restrictions: string[]
}

const MAX_POOL_SIZE = 5
const BUCKET_SIZE = 50

export class DietCacheService {
  constructor(
    private readonly redis: Redis | null,
    private readonly ttl: number = 21600, // 6h padrão
  ) {}

  /** Indica se o cache está disponível (Redis conectado) */
  get isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready'
  }

  /** Tenta buscar uma dieta aleatória do pool cacheado.
   *  Só retorna do cache quando o pool estiver cheio (MAX_POOL_SIZE).
   *  Enquanto o pool não estiver cheio, retorna null para que o caller
   *  chame a IA e adicione mais variantes ao pool. */
  async getRandomDiet(input: CacheKeyInput): Promise<Record<string, unknown> | null> {
    if (!this.isAvailable) return null

    try {
      const key = this.buildKey(input)
      const poolSize = await this.redis!.llen(key)

      // Pool ainda não está cheio — força chamada à IA para adicionar variantes
      if (poolSize < MAX_POOL_SIZE) return null

      const randomIndex = Math.floor(Math.random() * poolSize)
      const cached = await this.redis!.lindex(key, randomIndex)

      if (!cached) return null

      return JSON.parse(cached)
    } catch (error) {
      // Degradação graciosa: se Redis falhar, retorna null
      console.error('Diet cache read error:', error)
      return null
    }
  }

  /** Adiciona uma dieta gerada ao pool do cache */
  async addToPool(input: CacheKeyInput, diet: Record<string, unknown>): Promise<void> {
    if (!this.isAvailable) return

    try {
      const key = this.buildKey(input)
      const serialized = JSON.stringify(diet)

      // LPUSH adiciona no início da lista (mais recente primeiro)
      await this.redis!.lpush(key, serialized)

      // Mantém no máximo MAX_POOL_SIZE variantes (remove a mais antiga)
      await this.redis!.ltrim(key, 0, MAX_POOL_SIZE - 1)

      // Renova o TTL a cada nova variante adicionada
      await this.redis!.expire(key, this.ttl)
    } catch (error) {
      // Falha silenciosa: cache é best-effort
      console.error('Diet cache write error:', error)
    }
  }

  /** Constrói a cache key normalizada */
  buildKey(input: CacheKeyInput): string {
    const bucket = this.bucketizeCalories(input.adjustedTdee)
    const normalizedRestrictions = (input.restrictions || [])
      .map(r => r.toLowerCase().trim())
      .filter(Boolean)
      .sort()

    const restrictionsPart = normalizedRestrictions.length > 5
      ? createHash('sha256')
          .update(normalizedRestrictions.join(','))
          .digest('hex')
          .slice(0, 12)
      : normalizedRestrictions.join(',')

    return `diet:cache:${input.goal}:${bucket}:${restrictionsPart}`
  }

  /** Arredonda calorias para o bucket mais próximo */
  private bucketizeCalories(kcal: number): number {
    return Math.round(kcal / BUCKET_SIZE) * BUCKET_SIZE
  }
}
