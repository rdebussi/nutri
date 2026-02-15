import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { CheckInService } from './checkin.service.js'
import { createCheckInSchema, dateQuerySchema } from './checkin.validator.js'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'

// ====================================================
// CHECK-IN ROUTES
// ====================================================
// Rotas para o acompanhamento diário de dietas.
// Todas são protegidas (precisa de autenticação).
//
// POST /check-ins       → criar/atualizar check-in do dia
// GET  /check-ins       → buscar check-in de uma data (com refeições adaptadas)
// GET  /check-ins/stats → estatísticas semanais + streak
//
// FASE 3.3: As respostas de POST e GET agora incluem adaptedMeals e summary,
// que mostram as refeições recalculadas quando o usuário pula refeições
// ou faz exercícios extras.

export async function checkinRoutes(
  app: FastifyInstance,
  opts: { prisma: PrismaClient },
) {
  const checkinService = new CheckInService()

  // Protege todas as rotas
  app.addHook('onRequest', authMiddleware)

  // POST /api/v1/check-ins
  // Cria ou atualiza o check-in de um dia (upsert)
  // Retorna: { checkIn, adaptedMeals, summary }
  app.post('/', async (request, reply) => {
    const input = createCheckInSchema.parse(request.body)

    const result = await checkinService.createOrUpdate(
      request.userId!,
      input.dietId,
      input.date,
      input.meals,
      input.exercises,
    )

    return reply.status(201).send({ success: true, data: result })
  })

  // GET /api/v1/check-ins?date=YYYY-MM-DD
  // Busca check-in de uma data específica (default: hoje)
  // Retorna: { checkIn, adaptedMeals, summary } ou null
  app.get('/', async (request) => {
    const query = dateQuerySchema.parse(request.query)

    const result = await checkinService.getByDate(
      request.userId!,
      query.date,
    )

    return { success: true, data: result }
  })

  // GET /api/v1/check-ins/stats
  // Retorna estatísticas semanais + streak
  app.get('/stats', async (request) => {
    const stats = await checkinService.getWeeklyStats(request.userId!)

    return { success: true, data: stats }
  })
}
