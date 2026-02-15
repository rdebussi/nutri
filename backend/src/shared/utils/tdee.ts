// ====================================================
// TDEE CALCULATOR
// ====================================================
// TDEE = Total Daily Energy Expenditure (gasto calórico diário total)
//
// Fórmula Mifflin-St Jeor (padrão ouro para TMB):
//   Homem:  10 × peso(kg) + 6.25 × altura(cm) - 5 × idade + 5
//   Mulher: 10 × peso(kg) + 6.25 × altura(cm) - 5 × idade - 161
//
// TDEE = TMB × 1.2 (fator basal) + calorias dos exercícios
//
// O fator 1.2 representa o gasto básico de estar vivo:
// digestão, manutenção corporal, movimentos involuntários.
// Os exercícios são somados POR CIMA desse valor base.

const BASAL_ACTIVITY_FACTOR = 1.2

const INTENSITY_MULTIPLIERS: Record<string, number> = {
  LIGHT: 0.75,
  MODERATE: 1.0,
  INTENSE: 1.25,
}

const GOAL_MULTIPLIERS: Record<string, number> = {
  LOSE_WEIGHT: 0.80,   // déficit de 20%
  GAIN_MUSCLE: 1.15,    // superávit de 15%
  MAINTAIN: 1.0,
  HEALTH: 1.0,
}

// TMB (Taxa Metabólica Basal) — Mifflin-St Jeor
export function calculateBMR(input: {
  weight: number
  height: number
  age: number
  gender: string
}): number {
  const base = 10 * input.weight + 6.25 * input.height - 5 * input.age

  if (input.gender === 'MALE') {
    return base + 5
  }

  // FEMALE e OTHER usam a fórmula feminina
  return base - 161
}

// Calorias queimadas por exercício
export function calculateExerciseCalories(input: {
  met: number
  weightKg: number
  durationMinutes: number
  intensity?: string
}): number {
  const intensityMultiplier = INTENSITY_MULTIPLIERS[input.intensity || 'MODERATE'] || 1.0
  const adjustedMet = input.met * intensityMultiplier
  const durationHours = input.durationMinutes / 60

  return Math.round(adjustedMet * input.weightKg * durationHours)
}

// TDEE de um dia específico (TMB + exercícios do dia)
export function calculateDailyTDEE(input: {
  weight: number
  height: number
  age: number
  gender: string
  exercises: Array<{ met: number; durationMinutes: number; intensity?: string }>
}): number {
  const bmr = calculateBMR(input)
  const baseTdee = bmr * BASAL_ACTIVITY_FACTOR

  const exerciseCalories = input.exercises.reduce((total, exercise) => {
    return total + calculateExerciseCalories({
      met: exercise.met,
      weightKg: input.weight,
      durationMinutes: exercise.durationMinutes,
      intensity: exercise.intensity,
    })
  }, 0)

  return baseTdee + exerciseCalories
}

// TDEE médio semanal (baseado na rotina fixa)
export function calculateWeeklyAvgTDEE(input: {
  weight: number
  height: number
  age: number
  gender: string
  routines: Array<{ met: number; daysPerWeek: number; durationMinutes: number; intensity?: string }>
}): number {
  const bmr = calculateBMR(input)
  const baseTdee = bmr * BASAL_ACTIVITY_FACTOR

  const weeklyExerciseCalories = input.routines.reduce((total, routine) => {
    const perSession = calculateExerciseCalories({
      met: routine.met,
      weightKg: input.weight,
      durationMinutes: routine.durationMinutes,
      intensity: routine.intensity,
    })
    return total + perSession * routine.daysPerWeek
  }, 0)

  const dailyAvgExercise = weeklyExerciseCalories / 7

  return baseTdee + dailyAvgExercise
}

// Ajuste calórico baseado no objetivo
export function adjustForGoal(tdee: number, goal: string): number {
  const multiplier = GOAL_MULTIPLIERS[goal] || 1.0
  return Math.round(tdee * multiplier)
}
