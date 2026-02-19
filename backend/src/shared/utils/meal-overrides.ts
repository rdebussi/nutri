import type { IMeal, IFood } from '../../modules/diet/diet.model.js'

// ====================================================
// MEAL OVERRIDES — Fase 3.4c
// ====================================================
// Aplica edições completas de refeição (do check-in) sobre
// as meals originais da dieta. Função pura: não muta os dados
// originais, retorna uma cópia com as substituições aplicadas.
//
// Diferença entre FoodOverride e MealOverride:
// - FoodOverride: troca UM alimento específico na refeição
// - MealOverride: substitui TODA a lista de alimentos da refeição
//
// MealOverride tem prioridade sobre FoodOverride para o mesmo meal.

export interface IMealOverride {
  mealIndex: number
  originalFoods: IFood[]
  editedFoods: IFood[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

/**
 * Aplica meal overrides nas meals, retornando meals efetivas.
 * Deep clone para não mutar o original.
 * Overrides com índices inválidos são ignorados silenciosamente.
 */
export function applyMealOverrides(
  meals: IMeal[],
  overrides: IMealOverride[],
): IMeal[] {
  if (overrides.length === 0) return meals

  // Deep clone
  const result: IMeal[] = JSON.parse(JSON.stringify(meals))

  for (const override of overrides) {
    const meal = result[override.mealIndex]
    if (!meal) continue

    // Substitui a lista completa de alimentos
    meal.foods = [...override.editedFoods]

    // Recalcula totais da refeição
    meal.totalCalories = Math.round(
      meal.foods.reduce((sum, f) => sum + f.calories, 0),
    )
  }

  return result
}
