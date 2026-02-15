import { CheckIn } from './checkin.model.js'
import type { ICheckIn, MealStatus } from './checkin.model.js'
import { Diet } from '../diet/diet.model.js'
import type { IDiet } from '../diet/diet.model.js'
import { FoodItem } from '../food/food.model.js'
import { AppError, NotFoundError } from '../../shared/utils/errors.js'
import { calculateExerciseCalories } from '../../shared/utils/tdee.js'
import { recalculateMeals } from '../../shared/utils/meal-recalculator.js'
import type { RecalculationResult } from '../../shared/utils/meal-recalculator.js'
import { applyFoodOverrides } from '../../shared/utils/food-overrides.js'
import { calculateEquivalentGrams, calculateFoodMacros } from '../food/food.service.js'

// ====================================================
// CHECK-IN SERVICE
// ====================================================
// Lógica de negócio dos check-ins diários.
//
// FASE 3.3: Refeições Adaptativas
// Agora o check-in usa status (pending/completed/skipped) em vez de
// boolean completed. Quando o usuário pula uma refeição ou faz
// exercício extra, o motor de recálculo redistribui macros/calorias
// nas refeições restantes.

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

export type CheckInWithAdaptation = {
  checkIn: ICheckIn
  adaptedMeals: RecalculationResult['adaptedMeals']
  summary: RecalculationResult['summary']
}

export class CheckInService {

  // Cria ou atualiza o check-in de um dia
  async createOrUpdate(
    userId: string,
    dietId: string,
    date: string | undefined,
    meals: Array<{ mealName: string; status?: MealStatus; notes?: string }>,
    exercises?: Array<{
      exerciseName: string
      category: string
      met: number
      durationMinutes: number
      intensity?: string
      isExtra?: boolean
    }>,
    weightKg?: number,
  ): Promise<CheckInWithAdaptation> {
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

    // Adiciona timestamps para refeições com status
    const mealsWithTimestamp = meals.map(meal => ({
      mealName: meal.mealName,
      status: meal.status || 'pending',
      completedAt: meal.status === 'completed' ? new Date() : undefined,
      skippedAt: meal.status === 'skipped' ? new Date() : undefined,
      notes: meal.notes,
    }))

    // Calcula calorias queimadas por exercício
    const exerciseLogs = (exercises || []).map(ex => ({
      exerciseName: ex.exerciseName,
      category: ex.category,
      durationMinutes: ex.durationMinutes,
      isExtra: ex.isExtra ?? false,
      caloriesBurned: calculateExerciseCalories({
        met: ex.met,
        weightKg: weightKg || 70,
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

    // Roda o motor de recálculo
    const adaptation = this.computeAdaptation(checkIn, diet)

    return { checkIn, ...adaptation }
  }

  // Busca check-in de uma data específica (default: hoje)
  // Retorna com refeições adaptadas se houver dieta associada
  async getByDate(userId: string, date?: string): Promise<CheckInWithAdaptation | null> {
    const normalizedDate = normalizeDate(date)

    const checkIn = await CheckIn.findOne({ userId, date: normalizedDate }).lean()
    if (!checkIn) return null

    // Busca a dieta para calcular adaptações
    const diet = await Diet.findById(checkIn.dietId).lean()
    if (!diet) {
      return {
        checkIn: checkIn as ICheckIn,
        adaptedMeals: [],
        summary: {
          consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          remaining: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          dailyTarget: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          exerciseBonus: 0,
        },
      }
    }

    const adaptation = this.computeAdaptation(checkIn as ICheckIn, diet)

    return { checkIn: checkIn as ICheckIn, ...adaptation }
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
      mealsCompleted: c.meals.filter(m => m.status === 'completed').length,
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

      if (checkInDate.getTime() !== expectedDate.getTime()) {
        break
      }

      if (checkIn.adherenceRate > 50) {
        streak++
        expectedDate.setDate(expectedDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  // ====================================================
  // TROCA DE ALIMENTO NO CHECK-IN (por dia)
  // ====================================================
  // Salva um food override no check-in. NÃO modifica a dieta base.
  // O override é aplicado quando as adapted meals são calculadas.
  async swapFoodInCheckIn(
    userId: string,
    dietId: string,
    mealIndex: number,
    foodIndex: number,
    newFoodId: string,
    date?: string,
  ): Promise<CheckInWithAdaptation> {
    // Valida dieta
    const diet = await Diet.findById(dietId).lean()
    if (!diet) throw new NotFoundError('Dieta não encontrada')
    if (diet.userId !== userId) throw new AppError('Acesso negado', 403)

    // Valida índices
    if (mealIndex < 0 || mealIndex >= diet.meals.length) {
      throw new AppError('Refeição não encontrada', 400)
    }
    if (foodIndex < 0 || foodIndex >= diet.meals[mealIndex].foods.length) {
      throw new AppError('Alimento não encontrado na refeição', 400)
    }

    // Busca novo alimento na base TACO
    const newFoodItem = await FoodItem.findById(newFoodId).lean()
    if (!newFoodItem) throw new NotFoundError('Alimento não encontrado na base')

    // Calcula equivalência calórica
    const originalFood = diet.meals[mealIndex].foods[foodIndex]
    const equivalentGrams = calculateEquivalentGrams(originalFood.calories, newFoodItem)
    const newFood = calculateFoodMacros(newFoodItem, equivalentGrams)

    const normalizedDate = normalizeDate(date)

    // Busca check-in existente para preservar overrides anteriores
    const existing = await CheckIn.findOne({ userId, date: normalizedDate })
    let foodOverrides = existing?.foodOverrides || []

    // Remove override anterior na mesma posição (se existir)
    foodOverrides = foodOverrides.filter(
      (o: any) => !(o.mealIndex === mealIndex && o.foodIndex === foodIndex),
    )

    // Adiciona novo override
    foodOverrides.push({
      mealIndex,
      foodIndex,
      originalFood: { ...originalFood },
      newFood,
    })

    // Monta meals default (todas pending) caso check-in não exista
    const defaultMeals = diet.meals.map(m => ({
      mealName: m.name,
      status: 'pending' as MealStatus,
    }))

    // Upsert check-in com o novo override
    const checkIn = await CheckIn.findOneAndUpdate(
      { userId, date: normalizedDate },
      {
        $setOnInsert: {
          dietId,
          meals: defaultMeals,
          adherenceRate: 0,
          totalCaloriesBurned: 0,
        },
        $set: { foodOverrides },
      },
      { upsert: true, new: true, runValidators: true },
    )

    // Computa adapted meals com overrides aplicados
    const adaptation = this.computeAdaptation(checkIn, diet)

    return { checkIn, ...adaptation }
  }

  // ====================================================
  // MOTOR DE RECÁLCULO — integração
  // ====================================================
  // Computa as refeições adaptadas usando o motor de recálculo.
  // Recebe o check-in (com status das refeições e exercícios) e a dieta original.
  // Aplica food overrides antes de recalcular.
  private computeAdaptation(
    checkIn: ICheckIn,
    diet: IDiet,
  ): { adaptedMeals: RecalculationResult['adaptedMeals']; summary: RecalculationResult['summary'] } {
    // Aplica food overrides (trocas de alimento do check-in)
    const effectiveMeals = applyFoodOverrides(
      diet.meals,
      (checkIn.foodOverrides as any) || [],
    )

    // Monta mealStatuses a partir do check-in
    const mealStatuses: Record<string, 'completed' | 'skipped' | 'pending'> = {}
    for (const meal of checkIn.meals) {
      mealStatuses[meal.mealName] = meal.status || 'pending'
    }
    // Refeições da dieta que não estão no check-in ficam como 'pending'
    for (const meal of effectiveMeals) {
      if (!(meal.name in mealStatuses)) {
        mealStatuses[meal.name] = 'pending'
      }
    }

    // exerciseBonus = calorias de exercícios EXTRA (fora da rotina)
    const extraCaloriesBurned = (checkIn.exercises || [])
      .filter(e => e.isExtra)
      .reduce((sum, e) => sum + e.caloriesBurned, 0)

    // Usa a SOMA REAL das effectiveMeals como target (com overrides aplicados)
    const dailyTargets = {
      calories: effectiveMeals.reduce((sum, m) => sum + m.totalCalories, 0),
      protein: effectiveMeals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.protein, 0), 0),
      carbs: effectiveMeals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.carbs, 0), 0),
      fat: effectiveMeals.reduce((sum, m) => sum + m.foods.reduce((s, f) => s + f.fat, 0), 0),
    }

    const result = recalculateMeals({
      originalMeals: effectiveMeals,
      mealStatuses,
      dailyTargets,
      extraCaloriesBurned,
    })

    return {
      adaptedMeals: result.adaptedMeals,
      summary: result.summary,
    }
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

function calculateAdherence(meals: Array<{ status?: MealStatus }>): number {
  if (meals.length === 0) return 0
  const completed = meals.filter(m => m.status === 'completed').length
  return Math.round((completed / meals.length) * 100)
}
