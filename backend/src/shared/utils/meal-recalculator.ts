import type { IMeal, IFood } from '../../modules/diet/diet.model.js'

// ====================================================
// MOTOR DE RECÁLCULO DE REFEIÇÕES
// ====================================================
// Quando o usuário pula uma refeição ou faz exercício extra,
// as refeições restantes (pending) são escaladas para
// redistribuir calorias/macros e manter o target diário.
//
// Conceito: "Redistribuição proporcional"
// Se você pula um lanche de 200 kcal, essas 200 kcal são
// divididas entre as refeições restantes proporcionalmente
// ao tamanho original de cada uma. Refeições maiores absorvem
// mais calorias que refeições menores.

// ====================================================
// TYPES
// ====================================================

export type MacroSummary = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type AdaptedFood = IFood & {
  originalQuantity: string
  originalCalories: number
}

export type AdaptedMeal = {
  name: string
  time: string
  adapted: boolean
  scaleFactor: number
  foods: AdaptedFood[]
  totalCalories: number
  originalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

export type RecalculationInput = {
  originalMeals: IMeal[]
  mealStatuses: Record<string, 'completed' | 'skipped' | 'pending'>
  dailyTargets: MacroSummary
  extraCaloriesBurned: number
}

export type RecalculationResult = {
  adaptedMeals: AdaptedMeal[]
  summary: {
    consumed: MacroSummary
    remaining: MacroSummary
    dailyTarget: MacroSummary
    exerciseBonus: number
  }
}

// ====================================================
// QUANTITY PARSER
// ====================================================
// Parseia strings como "150g", "200ml", "2 fatias"
// para separar o número da unidade.

// Unidades contínuas (podem ter decimais): g, kg, ml, l, etc.
const CONTINUOUS_UNITS = new Set(['g', 'kg', 'ml', 'l', 'litro', 'litros'])

export function parseQuantity(quantity: string): { value: number; unit: string } {
  // Regex: captura número (com . ou ,) e o resto como unidade
  const match = quantity.match(/^([\d]+[.,]?\d*)\s*(.*)$/)

  if (!match) {
    return { value: 0, unit: quantity }
  }

  const value = parseFloat(match[1].replace(',', '.'))
  const unit = match[2].trim()

  return { value, unit }
}

export function scaleQuantity(quantity: string, factor: number): string {
  const { value, unit } = parseQuantity(quantity)

  if (value === 0) return quantity // "a gosto" → inalterado

  const scaled = value * factor

  // Unidades contínuas: arredonda para inteiro
  // Unidades discretas (fatias, unidades): arredonda para inteiro
  const rounded = CONTINUOUS_UNITS.has(unit.toLowerCase())
    ? Math.round(scaled)
    : Math.round(scaled)

  // Reconstrói: se tinha espaço entre número e unidade, mantém
  const hadSpace = quantity.match(/^\d[.,]?\d*\s+/)
  const separator = hadSpace ? ' ' : ''

  return `${rounded}${separator}${unit}`
}

// ====================================================
// HELPERS
// ====================================================

function sumMealMacros(meal: IMeal): MacroSummary {
  return {
    calories: meal.totalCalories,
    protein: meal.foods.reduce((sum, f) => sum + f.protein, 0),
    carbs: meal.foods.reduce((sum, f) => sum + f.carbs, 0),
    fat: meal.foods.reduce((sum, f) => sum + f.fat, 0),
  }
}

function addMacros(a: MacroSummary, b: MacroSummary): MacroSummary {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  }
}

const ZERO_MACROS: MacroSummary = { calories: 0, protein: 0, carbs: 0, fat: 0 }

// ====================================================
// MOTOR PRINCIPAL
// ====================================================

export function recalculateMeals(input: RecalculationInput): RecalculationResult {
  const { originalMeals, mealStatuses, dailyTargets, extraCaloriesBurned } = input

  // ====================================================
  // ALGORITMO SEQUENCIAL (por ordem cronológica)
  // ====================================================
  // Problema do algoritmo anterior: quando o usuário come uma
  // refeição que foi ADAPTADA (escalada), o consumed deve refletir
  // o valor adaptado, não o original.
  //
  // Exemplo: Skip café(400), come almoço adaptado(788 em vez de 700).
  // consumed deve ser 788, não 700. Senão o jantar fica com scaleFactor errado.
  //
  // Solução: processar refeições na ordem do dia. Para cada completed,
  // calcular o scaleFactor que estava vigente naquele momento e usar
  // o valor adaptado como consumed.

  // 1. Target ajustado com exercício extra
  const adjustedTarget: MacroSummary = {
    calories: dailyTargets.calories + extraCaloriesBurned,
    protein: dailyTargets.protein,
    carbs: dailyTargets.carbs,
    fat: dailyTargets.fat,
  }

  // 2. Ordenar refeições por horário
  const sortedMeals = [...originalMeals].sort((a, b) => a.time.localeCompare(b.time))

  // 3. Identificar pool de refeições não-skipped (completed + pending)
  //    e seus totais originais
  const nonSkippedMeals = sortedMeals.filter(m => {
    const status = mealStatuses[m.name] || 'pending'
    return status !== 'skipped'
  })

  // 4. Processamento sequencial: completed meals in time order
  //
  // hadSkipBefore: rastreia se alguma refeição FOI PULADA antes
  // desta no cronograma. Isso importa porque:
  // - Completed ANTES de qualquer skip → user comeu no valor original
  //   (não tinha adaptação visível quando comeu)
  // - Completed DEPOIS de um skip → user viu o valor adaptado e
  //   comeu a porção escalada
  let consumed: MacroSummary = { ...ZERO_MACROS }
  const adaptedMealMap = new Map<string, AdaptedMeal>()
  const processed = new Set<string>()
  let hadSkipBefore = false

  for (const meal of sortedMeals) {
    const status = mealStatuses[meal.name] || 'pending'
    const mealMacros = sumMealMacros(meal)

    if (status === 'skipped') {
      adaptedMealMap.set(meal.name, buildSkippedMeal(meal, mealMacros))
      processed.add(meal.name)
      hadSkipBefore = true
      continue
    }

    if (status === 'completed') {
      if (!hadSkipBefore) {
        // Nenhum skip antes → user comeu o valor original
        consumed = addMacros(consumed, mealMacros)

        adaptedMealMap.set(meal.name, {
          name: meal.name,
          time: meal.time,
          adapted: false,
          scaleFactor: 1,
          foods: meal.foods.map(f => ({
            ...f,
            originalQuantity: f.quantity,
            originalCalories: f.calories,
          })),
          totalCalories: meal.totalCalories,
          originalCalories: meal.totalCalories,
          totalProtein: mealMacros.protein,
          totalCarbs: mealMacros.carbs,
          totalFat: mealMacros.fat,
        })
      } else {
        // Houve skip antes → user viu valor adaptado e comeu a porção escalada
        // sf = budget restante / pool original restante (não-skipped, não-processado)
        const budget = adjustedTarget.calories - consumed.calories
        const poolOriginal = nonSkippedMeals
          .filter(m => !processed.has(m.name))
          .reduce((sum, m) => sum + m.totalCalories, 0)

        const sf = poolOriginal > 0 ? budget / poolOriginal : 1
        const isAdapted = Math.abs(sf - 1) >= 0.02

        const adaptedCals = Math.round(meal.totalCalories * sf)
        const adaptedP = Math.round(mealMacros.protein * sf * 10) / 10
        const adaptedC = Math.round(mealMacros.carbs * sf * 10) / 10
        const adaptedF = Math.round(mealMacros.fat * sf * 10) / 10

        consumed = addMacros(consumed, {
          calories: adaptedCals,
          protein: adaptedP,
          carbs: adaptedC,
          fat: adaptedF,
        })

        adaptedMealMap.set(meal.name, {
          name: meal.name,
          time: meal.time,
          adapted: isAdapted,
          scaleFactor: isAdapted ? Math.round(sf * 1000) / 1000 : 1,
          foods: meal.foods.map(f => ({
            name: f.name,
            quantity: isAdapted ? scaleQuantity(f.quantity, sf) : f.quantity,
            calories: isAdapted ? Math.round(f.calories * sf) : f.calories,
            protein: isAdapted ? Math.round(f.protein * sf * 10) / 10 : f.protein,
            carbs: isAdapted ? Math.round(f.carbs * sf * 10) / 10 : f.carbs,
            fat: isAdapted ? Math.round(f.fat * sf * 10) / 10 : f.fat,
            originalQuantity: f.quantity,
            originalCalories: f.calories,
          })),
          totalCalories: isAdapted ? adaptedCals : meal.totalCalories,
          originalCalories: meal.totalCalories,
          totalProtein: isAdapted ? adaptedP : mealMacros.protein,
          totalCarbs: isAdapted ? adaptedC : mealMacros.carbs,
          totalFat: isAdapted ? adaptedF : mealMacros.fat,
        })
      }
      processed.add(meal.name)
      continue
    }
    // pending: será processado abaixo
  }

  // 5. Processar refeições pendentes (todas usam o mesmo scaleFactor final)
  const pendingMeals = sortedMeals.filter(m => !processed.has(m.name))
  const totalPendingOriginal = pendingMeals.reduce((sum, m) => sum + m.totalCalories, 0)

  const remaining: MacroSummary = {
    calories: adjustedTarget.calories - consumed.calories,
    protein: adjustedTarget.protein - consumed.protein,
    carbs: adjustedTarget.carbs - consumed.carbs,
    fat: adjustedTarget.fat - consumed.fat,
  }

  const finalSf = totalPendingOriginal > 0 ? remaining.calories / totalPendingOriginal : 1
  const finalIsAdapted = Math.abs(finalSf - 1) >= 0.02

  for (const meal of pendingMeals) {
    const mealMacros = sumMealMacros(meal)
    adaptedMealMap.set(meal.name, {
      name: meal.name,
      time: meal.time,
      adapted: finalIsAdapted,
      scaleFactor: finalIsAdapted ? Math.round(finalSf * 1000) / 1000 : 1,
      foods: meal.foods.map(f => ({
        name: f.name,
        quantity: finalIsAdapted ? scaleQuantity(f.quantity, finalSf) : f.quantity,
        calories: finalIsAdapted ? Math.round(f.calories * finalSf) : f.calories,
        protein: finalIsAdapted ? Math.round(f.protein * finalSf * 10) / 10 : f.protein,
        carbs: finalIsAdapted ? Math.round(f.carbs * finalSf * 10) / 10 : f.carbs,
        fat: finalIsAdapted ? Math.round(f.fat * finalSf * 10) / 10 : f.fat,
        originalQuantity: f.quantity,
        originalCalories: f.calories,
      })),
      totalCalories: finalIsAdapted ? Math.round(meal.totalCalories * finalSf) : meal.totalCalories,
      originalCalories: meal.totalCalories,
      totalProtein: finalIsAdapted ? Math.round(mealMacros.protein * finalSf * 10) / 10 : mealMacros.protein,
      totalCarbs: finalIsAdapted ? Math.round(mealMacros.carbs * finalSf * 10) / 10 : mealMacros.carbs,
      totalFat: finalIsAdapted ? Math.round(mealMacros.fat * finalSf * 10) / 10 : mealMacros.fat,
    })
  }

  // 6. Montar resultado na ordem original (não na ordem cronológica)
  const adaptedMeals = originalMeals.map(m => adaptedMealMap.get(m.name)!)

  return {
    adaptedMeals,
    summary: {
      consumed,
      remaining,
      dailyTarget: adjustedTarget,
      exerciseBonus: extraCaloriesBurned,
    },
  }
}

// Helper: cria AdaptedMeal para refeição pulada (zerada)
function buildSkippedMeal(meal: IMeal, _mealMacros: MacroSummary): AdaptedMeal {
  return {
    name: meal.name,
    time: meal.time,
    adapted: false,
    scaleFactor: 0,
    foods: meal.foods.map(f => ({
      ...f,
      quantity: '0',
      calories: 0, protein: 0, carbs: 0, fat: 0,
      originalQuantity: f.quantity,
      originalCalories: f.calories,
    })),
    totalCalories: 0,
    originalCalories: meal.totalCalories,
    totalProtein: 0, totalCarbs: 0, totalFat: 0,
  }
}
