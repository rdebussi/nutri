import { z } from 'zod'

// ====================================================
// CHECK-IN VALIDATORS (Zod)
// ====================================================
// Validação dos inputs antes de chegar na lógica de negócio.
// Zod faz validação em runtime (quando o programa roda),
// diferente do TypeScript que só valida em compile-time.

const exerciseLogSchema = z.object({
  exerciseName: z.string().min(1),
  category: z.string().min(1),
  met: z.number().positive(),
  durationMinutes: z.number().int().min(1),
  intensity: z.enum(['LIGHT', 'MODERATE', 'INTENSE']).default('MODERATE'),
  isExtra: z.boolean().default(false),
})

const mealCheckInSchema = z.object({
  mealName: z.string().min(1, 'Nome da refeição é obrigatório'),
  completed: z.boolean(),
  notes: z.string().max(500, 'Notas devem ter no máximo 500 caracteres').optional(),
})

export const createCheckInSchema = z.object({
  dietId: z.string().min(1, 'ID da dieta é obrigatório'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
  meals: z.array(mealCheckInSchema).min(1, 'Pelo menos uma refeição é obrigatória'),
  exercises: z.array(exerciseLogSchema).optional(),
})

export const dateQuerySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
})

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>
export type DateQueryInput = z.infer<typeof dateQuerySchema>
