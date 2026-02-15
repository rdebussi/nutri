import Redis from 'ioredis'

// ====================================================
// CONEXÃO REDIS
// ====================================================
// Redis é um banco de dados IN-MEMORY (vive na RAM).
// É absurdamente rápido (~0.1ms por operação vs ~5ms do PostgreSQL).
//
// Usamos para:
// 1. CACHE: guardar respostas da IA (evita pagar de novo pela mesma dieta)
// 2. RATE LIMITING: contar requests por IP/usuário
// 3. SESSÕES: guardar refresh tokens (permite invalidação instantânea)
//
// Analogia: Redis é como a memória de curto prazo.
// PostgreSQL/MongoDB = caderno (permanente mas lento de consultar)
// Redis = post-it na mesa (rápido de ler mas temporário)

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true, // não conecta até a primeira operação
    })
  }
  return redis
}
