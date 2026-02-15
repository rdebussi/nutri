import { z } from 'zod'

// ====================================================
// EXERCISE VALIDATORS
// ====================================================
// Schema Zod para validar query params da busca de exercícios.
//
// Por que usar Zod aqui?
// Porque os query params vêm como strings do HTTP e precisamos
// garantir que os valores são válidos antes de usar no MongoDB.

const VALID_CATEGORIES = ['strength', 'cardio', 'sports', 'flexibility', 'daily'] as const

export const exerciseQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
})

export type ExerciseQuery = z.infer<typeof exerciseQuerySchema>
