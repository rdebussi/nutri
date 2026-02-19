import { z } from 'zod'
import { FOOD_CATEGORIES } from './food.model.js'

// ====================================================
// USER FOOD VALIDATORS (Zod)
// ====================================================
// Validação para alimentos customizados do usuário.
//
// Dois modos de input:
// 1. Por 100g (padrão): informar macros diretamente por 100g
// 2. Por porção: informar servingSize + macros POR PORÇÃO
//    → o service converte para per-100g antes de salvar

export const createUserFoodSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  category: z.enum(FOOD_CATEGORIES),
  ingredients: z.string().max(500).optional(),

  // Macros — podem ser por 100g ou por porção
  caloriesPer100g: z.number().min(0).optional(),
  proteinPer100g: z.number().min(0).optional(),
  carbsPer100g: z.number().min(0).optional(),
  fatPer100g: z.number().min(0).optional(),

  // Input por porção (opcional)
  servingSize: z.number().min(1).optional(),
  servingName: z.string().min(1).max(50).optional(),
  caloriesPerServing: z.number().min(0).optional(),
  proteinPerServing: z.number().min(0).optional(),
  carbsPerServing: z.number().min(0).optional(),
  fatPerServing: z.number().min(0).optional(),
}).refine(
  (data) => {
    const hasPer100g = data.caloriesPer100g !== undefined
    const hasPerServing = data.caloriesPerServing !== undefined && data.servingSize !== undefined
    return hasPer100g || hasPerServing
  },
  { message: 'Informe macros por 100g ou por porção (com servingSize)' },
)

// Zod v4 não permite .partial() em schemas com .refine(),
// então definimos o update schema separadamente com todos os campos opcionais.
export const updateUserFoodSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  category: z.enum(FOOD_CATEGORIES).optional(),
  ingredients: z.string().max(500).optional(),
  caloriesPer100g: z.number().min(0).optional(),
  proteinPer100g: z.number().min(0).optional(),
  carbsPer100g: z.number().min(0).optional(),
  fatPer100g: z.number().min(0).optional(),
  servingSize: z.number().min(1).optional(),
  servingName: z.string().min(1).max(50).optional(),
  caloriesPerServing: z.number().min(0).optional(),
  proteinPerServing: z.number().min(0).optional(),
  carbsPerServing: z.number().min(0).optional(),
  fatPerServing: z.number().min(0).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Pelo menos um campo deve ser atualizado' },
)

export const userFoodQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(FOOD_CATEGORIES).optional(),
})

export type CreateUserFoodInput = z.infer<typeof createUserFoodSchema>
export type UpdateUserFoodInput = z.infer<typeof updateUserFoodSchema>
