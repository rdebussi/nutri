import { z } from 'zod'

// ====================================================
// VALIDADORES DO MÓDULO USER
// ====================================================
// Aqui usamos z.enum() para validar valores que vêm
// de enums do banco (Gender, Goal).
// Se o frontend mandar "INVALID_GOAL", o Zod rejeita
// ANTES de chegar no banco, evitando erro feio do PostgreSQL.
//
// Nota: activityLevel foi removido do perfil porque a rotina
// de exercícios (ExerciseRoutine) calcula o gasto real com MET.
// Manter activityLevel seria redundante e menos preciso.

// Schema para cada exercício na rotina semanal
const exerciseRoutineItemSchema = z.object({
  exerciseName: z.string().min(1),
  category: z.enum(['strength', 'cardio', 'sports', 'flexibility', 'daily']),
  met: z.number().positive(),
  daysPerWeek: z.number().int().min(1).max(7),
  durationMinutes: z.number().int().min(1).max(480),
  intensity: z.enum(['LIGHT', 'MODERATE', 'INTENSE']).default('MODERATE'),
})

// Schema para o PUT /me/routines — recebe array de rotinas
export const updateRoutinesSchema = z.object({
  routines: z.array(exerciseRoutineItemSchema).max(20),
})

export type UpdateRoutinesInput = z.infer<typeof updateRoutinesSchema>

export const updateProfileSchema = z.object({
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  weight: z.number().positive('Peso deve ser positivo').optional(),
  height: z.number().positive('Altura deve ser positiva').optional(),
  goal: z.enum(['LOSE_WEIGHT', 'GAIN_MUSCLE', 'MAINTAIN', 'HEALTH']).optional(),
  restrictions: z.array(z.string()).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
