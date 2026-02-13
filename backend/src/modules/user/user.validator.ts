import { z } from 'zod'

// ====================================================
// VALIDADORES DO MÓDULO USER
// ====================================================
// Aqui usamos z.enum() para validar valores que vêm
// de enums do banco (Gender, Goal, ActivityLevel).
// Se o frontend mandar "INVALID_GOAL", o Zod rejeita
// ANTES de chegar no banco, evitando erro feio do PostgreSQL.

export const updateProfileSchema = z.object({
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  weight: z.number().positive('Peso deve ser positivo').optional(),
  height: z.number().positive('Altura deve ser positiva').optional(),
  goal: z.enum(['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN', 'HEALTH']).optional(),
  activityLevel: z
    .enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'])
    .optional(),
  restrictions: z.array(z.string()).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
