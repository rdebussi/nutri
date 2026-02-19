import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { FoodFavoriteService } from './food-favorite.service.js'
import { authMiddleware } from '../../shared/middleware/auth.middleware.js'

// ====================================================
// FOOD FAVORITE ROUTES
// ====================================================
// POST   /api/v1/foods/favorites          → toggle favorito
// GET    /api/v1/foods/favorites          → listar favoritos
// DELETE /api/v1/foods/favorites/:foodId  → remover favorito

const toggleSchema = z.object({
  foodId: z.string().min(1, 'ID do alimento é obrigatório'),
  foodSource: z.enum(['database', 'custom']),
})

export async function foodFavoriteRoutes(
  app: FastifyInstance,
  _opts: { prisma: PrismaClient },
) {
  const service = new FoodFavoriteService()

  app.addHook('onRequest', authMiddleware)

  // POST /api/v1/foods/favorites — toggle
  app.post('/', async (request) => {
    const { foodId, foodSource } = toggleSchema.parse(request.body)
    const result = await service.toggle(request.userId!, foodId, foodSource)
    return { success: true, data: result }
  })

  // GET /api/v1/foods/favorites — listar com dados populados
  app.get('/', async (request) => {
    const favorites = await service.list(request.userId!)
    return { success: true, data: favorites }
  })

  // DELETE /api/v1/foods/favorites/:foodId — remover direto
  app.delete<{ Params: { foodId: string } }>('/:foodId', async (request, reply) => {
    // Usa toggle internamente — se existe, remove
    await service.toggle(request.userId!, request.params.foodId, 'database')
    return reply.status(204).send()
  })
}
