import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { DietService } from './diet.service.js'
import { DietCacheService } from './diet-cache.service.js'
import { AiService } from '../ai/ai.service.js'
import { MockAiService } from '../ai/ai.mock.js'
import { getRedis } from '../../shared/database/redis.js'
import { env } from '../../config/env.js'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'
import { AppError } from '../../shared/utils/errors.js'

// ====================================================
// DIET ROUTES
// ====================================================
// Todas as rotas são protegidas (precisa de autenticação).
// O fluxo de gerar uma dieta:
//
// 1. POST /diets/generate → DietService.generate()
//    → busca perfil (PostgreSQL)
//    → verifica limites
//    → chama OpenAI
//    → salva dieta (MongoDB)
//    → retorna dieta
//
// 2. GET /diets → lista todas as dietas do usuário
// 3. GET /diets/:id → retorna uma dieta específica

export async function dietRoutes(
  app: FastifyInstance,
  opts: { prisma: PrismaClient }
) {
  // Se não tem API key, usa o mock (dieta fake para testar a interface)
  const apiKey = process.env.GEMINI_API_KEY
  const aiService = apiKey && apiKey !== 'your-gemini-key-here'
    ? new AiService(apiKey)
    : new MockAiService()

  // Cache Redis: server.ts já conecta o singleton, aqui só instanciamos o service.
  // DietCacheService verifica isAvailable internamente (graceful se Redis estiver fora).
  const redis = getRedis()
  const dietCache = new DietCacheService(redis, env.DIET_CACHE_TTL)

  const dietService = new DietService(opts.prisma, aiService as AiService, dietCache)

  // Protege todas as rotas
  app.addHook('onRequest', authMiddleware)

  // POST /api/v1/diets/generate
  // Gera uma nova dieta com IA
  app.post('/generate', async (request, reply) => {
    const diet = await dietService.generate(request.userId!)

    // 201 = Created (novo recurso criado)
    return reply.status(201).send({ success: true, data: diet })
  })

  // GET /api/v1/diets
  // Lista todas as dietas do usuário
  app.get('/', async (request) => {
    const diets = await dietService.listByUser(request.userId!)
    return { success: true, data: diets }
  })

  // GET /api/v1/diets/:id
  // Retorna uma dieta específica
  // :id é um "route parameter" — o Fastify extrai o valor da URL.
  // Ex: /diets/abc123 → params.id = "abc123"
  app.get<{ Params: { id: string } }>('/:id', async (request) => {
    const diet = await dietService.getById(request.params.id, request.userId!)
    return { success: true, data: diet }
  })

  // PATCH /api/v1/diets/:id/meals/:mealIndex/foods/:foodIndex/swap
  // Troca um alimento na dieta por outro da base TACO.
  // Calcula quantidade equivalente em calorias e recalcula todos os totais.
  app.patch<{
    Params: { id: string; mealIndex: string; foodIndex: string }
    Body: { newFoodId: string }
  }>('/:id/meals/:mealIndex/foods/:foodIndex/swap', async (request) => {
    const { id, mealIndex, foodIndex } = request.params
    const { newFoodId } = request.body as { newFoodId: string }

    if (!newFoodId) {
      throw new AppError('newFoodId é obrigatório', 400)
    }

    const diet = await dietService.swapFood(
      id,
      request.userId!,
      Number(mealIndex),
      Number(foodIndex),
      newFoodId,
    )

    return { success: true, data: diet }
  })

  // POST /api/v1/diets/:id/meals/:mealIndex/refresh
  // Regenera uma refeição com IA: mesmas calorias, ingredientes diferentes.
  // Controla limites: FREE=2/dia, PRO=10/dia, ADMIN=ilimitado.
  app.post<{
    Params: { id: string; mealIndex: string }
  }>('/:id/meals/:mealIndex/refresh', async (request) => {
    const { id, mealIndex } = request.params

    const result = await dietService.refreshMeal(
      id,
      request.userId!,
      Number(mealIndex),
    )

    return { success: true, data: result }
  })
}
