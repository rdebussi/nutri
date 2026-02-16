import Redis from 'ioredis'
import { env } from '../../config/env.js'

// ====================================================
// CONEXÃO REDIS
// ====================================================
// Redis é um banco de dados IN-MEMORY (vive na RAM).
// É absurdamente rápido (~0.1ms por operação vs ~5ms do PostgreSQL).
//
// Usamos para:
// 1. CACHE: guardar respostas da IA (evita pagar de novo pela mesma dieta)
// 2. RATE LIMITING: contar requests por IP/usuário (futuro)
// 3. SESSÕES: guardar refresh tokens (futuro)
//
// Analogia: Redis é como a memória de curto prazo.
// PostgreSQL/MongoDB = caderno (permanente mas lento de consultar)
// Redis = post-it na mesa (rápido de ler mas temporário)

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true, // não conecta até chamar .connect()
    })
  }
  return redis
}
