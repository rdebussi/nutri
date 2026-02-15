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
// GET  /check-ins       → buscar check-in de uma data
// GET  /check-ins/stats → estatísticas semanais + streak

export async function checkinRoutes(
  app: FastifyInstance,
  opts: { prisma: PrismaClient },
) {
  const checkinService = new CheckInService()

  // Protege todas as rotas
  app.addHook('onRequest', authMiddleware)

  // POST /api/v1/check-ins
  // Cria ou atualiza o check-in de um dia (upsert)
  app.post('/', async (request, reply) => {
    const input = createCheckInSchema.parse(request.body)

    const checkIn = await checkinService.createOrUpdate(
      request.userId!,
      input.dietId,
      input.date,
      input.meals,
      input.exercises,
    )

    return reply.status(201).send({ success: true, data: checkIn })
  })

  // GET /api/v1/check-ins?date=YYYY-MM-DD
  // Busca check-in de uma data específica (default: hoje)
  app.get('/', async (request) => {
    const query = dateQuerySchema.parse(request.query)

    const checkIn = await checkinService.getByDate(
      request.userId!,
      query.date,
    )

    return { success: true, data: checkIn }
  })

  // GET /api/v1/check-ins/stats
  // Retorna estatísticas semanais + streak
  app.get('/stats', async (request) => {
    const stats = await checkinService.getWeeklyStats(request.userId!)

    return { success: true, data: stats }
  })
}
