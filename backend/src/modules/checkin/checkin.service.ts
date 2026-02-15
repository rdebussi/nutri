import { CheckIn } from './checkin.model.js'
import type { ICheckIn } from './checkin.model.js'
import { Diet } from '../diet/diet.model.js'
import { AppError } from '../../shared/utils/errors.js'
import { NotFoundError } from '../../shared/utils/errors.js'
import { calculateExerciseCalories } from '../../shared/utils/tdee.js'

// ====================================================
// CHECK-IN SERVICE
// ====================================================
// Lógica de negócio dos check-ins diários.
//
// Conceitos importantes:
//
// 1. UPSERT — "update or insert"
//    Se o check-in do dia já existe, atualiza. Se não, cria.
//    Usa findOneAndUpdate com opção { upsert: true }.
//
// 2. NORMALIZAÇÃO DE DATA
//    Toda data é normalizada para 00:00:00.000 do dia.
//    Assim, "2026-02-15T14:30:00" e "2026-02-15T08:00:00"
//    apontam para o mesmo check-in.
//
// 3. STREAK — sequência de dias consecutivos
//    Conta quantos dias seguidos o usuário fez check-in
//    com aderência > 50%. Gamificação simples.

export type WeeklyDayStat = {
  date: string
  adherenceRate: number
  mealsCompleted: number
  mealsTotal: number
}

export type WeeklyStats = {
  weeklyStats: WeeklyDayStat[]
  streak: number
  averageAdherence: number
}

export class CheckInService {

  // Cria ou atualiza o check-in de um dia
  async createOrUpdate(
    userId: string,
    dietId: string,
    date: string | undefined,
    meals: Array<{ mealName: string; completed: boolean; notes?: string }>,
    exercises?: Array<{
      exerciseName: string
      category: string
      met: number
      durationMinutes: number
      intensity?: string
      isExtra?: boolean
    }>,
    weightKg?: number,
  ): Promise<ICheckIn> {
    // Verifica se a dieta existe e pertence ao usuário
    const diet = await Diet.findById(dietId).lean()
    if (!diet) {
      throw new NotFoundError('Dieta não encontrada')
    }
    if (diet.userId !== userId) {
      throw new AppError('Acesso negado', 403)
    }

    const normalizedDate = normalizeDate(date)
    const adherenceRate = calculateAdherence(meals)

    // Adiciona completedAt para refeições marcadas como completed
    const mealsWithTimestamp = meals.map(meal => ({
      ...meal,
      completedAt: meal.completed ? new Date() : undefined,
    }))

    // Calcula calorias queimadas por exercício
    const exerciseLogs = (exercises || []).map(ex => ({
      exerciseName: ex.exerciseName,
      category: ex.category,
      durationMinutes: ex.durationMinutes,
      isExtra: ex.isExtra ?? false,
      caloriesBurned: calculateExerciseCalories({
        met: ex.met,
        weightKg: weightKg || 70, // fallback 70kg se não informado
        durationMinutes: ex.durationMinutes,
        intensity: ex.intensity,
      }),
    }))

    const totalCaloriesBurned = exerciseLogs.reduce((sum, e) => sum + e.caloriesBurned, 0)

    const checkIn = await CheckIn.findOneAndUpdate(
      { userId, date: normalizedDate },
      {
        dietId,
        meals: mealsWithTimestamp,
        adherenceRate,
        exercises: exerciseLogs,
        totalCaloriesBurned,
      },
      { upsert: true, new: true, runValidators: true },
    )

    return checkIn
  }

  // Busca check-in de uma data específica (default: hoje)
  async getByDate(userId: string, date?: string): Promise<ICheckIn | null> {
    const normalizedDate = normalizeDate(date)

    return CheckIn.findOne({ userId, date: normalizedDate }).lean()
  }

  // Estatísticas dos últimos 7 dias
  async getWeeklyStats(userId: string): Promise<WeeklyStats> {
    const today = normalizeDate()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const checkIns = await CheckIn.find({
      userId,
      date: { $gte: sevenDaysAgo },
    })
      .sort({ date: -1 })
      .lean()

    const weeklyStats: WeeklyDayStat[] = checkIns.map(c => ({
      date: c.date.toISOString().split('T')[0],
      adherenceRate: c.adherenceRate,
      mealsCompleted: c.meals.filter(m => m.completed).length,
      mealsTotal: c.meals.length,
    }))

    const averageAdherence = weeklyStats.length > 0
      ? Math.round(weeklyStats.reduce((sum, s) => sum + s.adherenceRate, 0) / weeklyStats.length)
      : 0

    const streak = await this.getStreak(userId)

    return { weeklyStats, streak, averageAdherence }
  }

  // Calcula streak de dias consecutivos com aderência > 50%
  async getStreak(userId: string): Promise<number> {
    const checkIns = await CheckIn.find({ userId })
      .sort({ date: -1 })
      .lean()

    if (checkIns.length === 0) return 0

    let streak = 0
    const expectedDate = normalizeDate()

    for (const checkIn of checkIns) {
      const checkInDate = new Date(checkIn.date)
      checkInDate.setHours(0, 0, 0, 0)

      // Se não é o dia esperado, quebra o streak
      if (checkInDate.getTime() !== expectedDate.getTime()) {
        break
      }

      // Só conta se aderência > 50%
      if (checkIn.adherenceRate > 50) {
        streak++
        expectedDate.setDate(expectedDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }
}

// ====================================================
// HELPERS
// ====================================================

function normalizeDate(date?: string | Date): Date {
  const d = date ? new Date(date) : new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function calculateAdherence(meals: Array<{ completed: boolean }>): number {
  if (meals.length === 0) return 0
  const completed = meals.filter(m => m.completed).length
  return Math.round((completed / meals.length) * 100)
}
