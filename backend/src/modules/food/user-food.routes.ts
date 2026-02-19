import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { UserFoodService } from './user-food.service.js'
import {
  createUserFoodSchema,
  updateUserFoodSchema,
  userFoodQuerySchema,
} from './user-food.validator.js'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'

// ====================================================
// USER FOOD ROUTES
// ====================================================
// CRUD de alimentos customizados do usuário.
// Todas protegidas por auth — cada user só vê/edita os seus.
//
// POST   /api/v1/foods/custom       → criar alimento
// GET    /api/v1/foods/custom       → listar meus alimentos
// PUT    /api/v1/foods/custom/:id   → editar alimento
// DELETE /api/v1/foods/custom/:id   → remover alimento

export async function userFoodRoutes(
  app: FastifyInstance,
  _opts: { prisma: PrismaClient },
) {
  const service = new UserFoodService()

  app.addHook('onRequest', authMiddleware)

  // POST /api/v1/foods/custom
  app.post('/', async (request, reply) => {
    const data = createUserFoodSchema.parse(request.body)
    const food = await service.create(request.userId!, data)
    return reply.status(201).send({ success: true, data: food })
  })

  // GET /api/v1/foods/custom
  app.get('/', async (request) => {
    const query = userFoodQuerySchema.parse(request.query)
    const foods = await service.list(request.userId!, query.search, query.category)
    return { success: true, data: foods }
  })

  // PUT /api/v1/foods/custom/:id
  app.put<{ Params: { id: string } }>('/:id', async (request) => {
    const data = updateUserFoodSchema.parse(request.body)
    const food = await service.update(request.userId!, request.params.id, data)
    return { success: true, data: food }
  })

  // DELETE /api/v1/foods/custom/:id
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await service.remove(request.userId!, request.params.id)
    return reply.status(204).send()
  })
}
