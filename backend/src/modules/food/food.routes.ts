import type { FastifyInstance } from 'fastify'
import jwt from 'jsonwebtoken'
import { FoodItem } from './food.model.js'
import { UserFood } from './user-food.model.js'
import { FoodFavoriteService } from './food-favorite.service.js'
import { foodQuerySchema } from './food.validator.js'

// ====================================================
// FOOD ROUTES
// ====================================================
// Rotas PÚBLICAS para consultar a base de alimentos.
// Não precisa de autenticação — qualquer usuário pode
// buscar alimentos para trocar na sua dieta.
//
// Quando autenticado, suporta ?include=custom,favorites:
// - custom: inclui alimentos do usuário nos resultados
// - favorites: marca cada resultado com isFavorite: true/false

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const favoriteService = new FoodFavoriteService()

function extractUserId(request: any): string | null {
  const authHeader = request.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const token = authHeader.substring(7)
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string }
    return payload.sub
  } catch {
    return null
  }
}

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

    // Base results com source marker
    let results: any[] = foods.map(f => ({ ...f, source: 'database' }))

    // Parse include flags
    const includes = (query.include || '').split(',').map(s => s.trim())
    const includeCustom = includes.includes('custom')
    const includeFavorites = includes.includes('favorites')

    // Tenta extrair userId do token (sem bloquear se não tiver)
    const userId = extractUserId(request)

    // Merge custom foods se solicitado e autenticado
    if (includeCustom && userId) {
      const customFilter: Record<string, unknown> = { userId }
      if (query.category) customFilter.category = query.category
      if (query.search) customFilter.name = new RegExp(query.search, 'i')

      const customFoods = await UserFood.find(customFilter)
        .sort({ name: 1 })
        .lean()

      const customResults = customFoods.map(f => ({
        ...f,
        source: 'custom',
        commonPortions: (f as any).servingSize && (f as any).servingName
          ? [{ name: (f as any).servingName, grams: (f as any).servingSize }]
          : [],
      }))

      results = [...results, ...customResults]
    }

    // Marca favoritos se solicitado e autenticado
    if (includeFavorites && userId) {
      const favoriteIds = await favoriteService.getFavoriteIds(userId)
      results = results.map(f => ({
        ...f,
        isFavorite: favoriteIds.has(f._id?.toString() || ''),
      }))
    }

    return { success: true, data: results }
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
