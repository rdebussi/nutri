import type { IMeal, IFood } from '../../modules/diet/diet.model.js'

// ====================================================
// FOOD OVERRIDES — Fase 3.4b
// ====================================================
// Aplica substituições de alimentos (do check-in) sobre as
// meals originais da dieta. Função pura: não muta os dados
// originais, retorna uma cópia com as substituições aplicadas.
//
// Isso permite que o check-in tenha trocas "por dia" sem
// alterar a dieta base do usuário.

export interface IFoodOverride {
  mealIndex: number
  foodIndex: number
  originalFood: IFood
  newFood: IFood
}

/**
 * Aplica food overrides nas meals, retornando meals efetivas.
 * Deep clone para não mutar o original.
 * Overrides com índices inválidos são ignorados silenciosamente.
 * Se a mesma posição for sobrescrita mais de uma vez, o último override ganha.
 */
export function applyFoodOverrides(
  meals: IMeal[],
  overrides: IFoodOverride[],
): IMeal[] {
  if (overrides.length === 0) return meals

  // Deep clone
  const result: IMeal[] = JSON.parse(JSON.stringify(meals))

  for (const override of overrides) {
    const meal = result[override.mealIndex]
    if (!meal) continue
    if (!meal.foods[override.foodIndex]) continue

    meal.foods[override.foodIndex] = { ...override.newFood }
  }

  // Recalcula totalCalories de cada meal afetada
  const affectedMeals = new Set(overrides.map(o => o.mealIndex))
  for (const mealIndex of affectedMeals) {
    const meal = result[mealIndex]
    if (!meal) continue
    meal.totalCalories = Math.round(
      meal.foods.reduce((sum, f) => sum + f.calories, 0),
    )
  }

  return result
}
