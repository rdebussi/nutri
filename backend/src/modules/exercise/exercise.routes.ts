import type { FastifyInstance } from 'fastify'
import { Exercise } from './exercise.model.js'
import { exerciseQuerySchema } from './exercise.validator.js'

// ====================================================
// EXERCISE ROUTES
// ====================================================
// Rotas PÚBLICAS para consultar a base de exercícios.
// Não precisa de autenticação — qualquer usuário pode
// buscar exercícios para montar sua rotina.
//
// GET /exercises         → listar todos
// GET /exercises?search= → buscar por nome (regex case-insensitive)
// GET /exercises?category= → filtrar por categoria

export async function exerciseRoutes(app: FastifyInstance) {
  // GET /api/v1/exercises
  app.get('/', async (request, reply) => {
    const query = exerciseQuerySchema.parse(request.query)

    // Monta o filtro do MongoDB dinamicamente
    const filter: Record<string, unknown> = {}

    if (query.category) {
      filter.category = query.category
    }

    if (query.search) {
      // Regex case-insensitive para busca parcial
      // Ex: "muscu" encontra "Musculação"
      filter.name = new RegExp(query.search, 'i')
    }

    const exercises = await Exercise.find(filter)
      .sort({ category: 1, name: 1 })
      .lean()

    return { success: true, data: exercises }
  })
}
