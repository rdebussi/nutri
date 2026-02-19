import { z } from 'zod'
import { FOOD_CATEGORIES } from './food.model.js'

// ====================================================
// FOOD VALIDATORS
// ====================================================
// Schema Zod para validar query params da busca de alimentos.
// Mesmo padrão de exercise.validator.ts.

export const foodQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(FOOD_CATEGORIES).optional(),
  include: z.string().optional(), // "custom", "favorites", ou "custom,favorites"
})

export type FoodQuery = z.infer<typeof foodQuerySchema>
