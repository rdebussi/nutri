import type { FastifyInstance } from 'fastify'
import { FoodItem } from './food.model.js'
import { foodQuerySchema } from './food.validator.js'

// ====================================================
// FOOD ROUTES
// ====================================================
// Rotas PÚBLICAS para consultar a base de alimentos.
// Não precisa de autenticação — qualquer usuário pode
// buscar alimentos para trocar na sua dieta.
//
// Segue o mesmo padrão de exercise.routes.ts:
// GET /foods          → listar todos
// GET /foods?search=  → buscar por nome (regex case-insensitive)
// GET /foods?category= → filtrar por categoria

export async function foodRoutes(app: FastifyInstance) {
  // GET /api/v1/foods
  app.get('/', async (request) => {
    const query = foodQuerySchema.parse(request.query)

    const filter: Record<string, unknown> = {}

    if (query.category) {
      filter.category = query.category
    }

    if (query.search) {
      filter.name = new RegExp(query.search, 'i')
    }

    const foods = await FoodItem.find(filter)
      .sort({ category: 1, name: 1 })
      .lean()

    return { success: true, data: foods }
  })

  // GET /api/v1/foods/:id/suggestions
  // Retorna alimentos da mesma categoria com calorias similares (±30%)
  app.get<{ Params: { id: string } }>('/:id/suggestions', async (request, reply) => {
    const food = await FoodItem.findById(request.params.id).lean()

    if (!food) {
      return reply.status(404).send({
        success: false,
        error: 'Alimento não encontrado',
      })
    }

    const minCal = food.caloriesPer100g * 0.7
    const maxCal = food.caloriesPer100g * 1.3

    const suggestions = await FoodItem.find({
      _id: { $ne: food._id },
      category: food.category,
      caloriesPer100g: { $gte: minCal, $lte: maxCal },
    })
      .sort({ name: 1 })
      .limit(10)
      .lean()

    return { success: true, data: suggestions }
  })
}
