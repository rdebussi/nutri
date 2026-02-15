import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '../../generated/prisma/client.js'
import { DietService } from './diet.service.js'
import { AiService } from '../ai/ai.service.js'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'

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
  const aiService = new AiService(process.env.OPENAI_API_KEY || '')
  const dietService = new DietService(opts.prisma, aiService)

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
}
