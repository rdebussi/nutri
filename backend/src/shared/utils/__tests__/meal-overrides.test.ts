import { describe, it, expect } from 'vitest'
import { applyMealOverrides } from '../meal-overrides.js'
import type { IMealOverride } from '../meal-overrides.js'
import type { IMeal } from '../../../modules/diet/diet.model.js'

// ====================================================
// TESTES DE MEAL OVERRIDES
// ====================================================

function makeMeals(): IMeal[] {
  return [
    {
      name: 'Café da manhã', time: '07:00', totalCalories: 400,
      foods: [
        { name: 'Pão integral', quantity: '100g', calories: 250, protein: 10, carbs: 40, fat: 3 },
        { name: 'Queijo branco', quantity: '30g', calories: 90, protein: 6, carbs: 1, fat: 7 },
        { name: 'Café preto', quantity: '200ml', calories: 60, protein: 1, carbs: 10, fat: 2 },
      ],
    },
    {
      name: 'Almoço', time: '12:00', totalCalories: 600,
      foods: [
        { name: 'Arroz', quantity: '200g', calories: 256, protein: 5, carbs: 56, fat: 0.4 },
        { name: 'Frango', quantity: '150g', calories: 239, protein: 48, carbs: 0, fat: 3.8 },
        { name: 'Salada', quantity: '100g', calories: 105, protein: 2, carbs: 12, fat: 5 },
      ],
    },
    {
      name: 'Jantar', time: '19:00', totalCalories: 500,
      foods: [
        { name: 'Salmão', quantity: '200g', calories: 400, protein: 40, carbs: 0, fat: 26 },
        { name: 'Batata doce', quantity: '150g', calories: 100, protein: 1, carbs: 24, fat: 0.1 },
      ],
    },
  ]
}

describe('applyMealOverrides', () => {
  it('should return original meals when no overrides', () => {
    const meals = makeMeals()
    const result = applyMealOverrides(meals, [])

    // Sem overrides retorna a referência original (sem clone)
    expect(result).toBe(meals)
  })

  it('should not mutate the original meals array', () => {
    const meals = makeMeals()
    const originalFirstMealName = meals[0].foods[0].name

    const override: IMealOverride = {
      mealIndex: 0,
      originalFoods: meals[0].foods,
      editedFoods: [
        { name: 'Sonho', quantity: '1 unidade', calories: 350, protein: 5, carbs: 45, fat: 18 },
      ],
      totalCalories: 350,
      totalProtein: 5,
      totalCarbs: 45,
      totalFat: 18,
    }

    applyMealOverrides(meals, [override])

    // Original permanece inalterado
    expect(meals[0].foods[0].name).toBe(originalFirstMealName)
    expect(meals[0].foods).toHaveLength(3)
  })

  it('should replace all foods in the overridden meal', () => {
    const meals = makeMeals()
    const editedFoods = [
      { name: 'Sonho', quantity: '1 unidade', calories: 350, protein: 5, carbs: 45, fat: 18 },
      { name: 'Café com leite', quantity: '300ml', calories: 120, protein: 4, carbs: 15, fat: 5 },
    ]

    const override: IMealOverride = {
      mealIndex: 0,
      originalFoods: meals[0].foods,
      editedFoods,
      totalCalories: 470,
      totalProtein: 9,
      totalCarbs: 60,
      totalFat: 23,
    }

    const result = applyMealOverrides(meals, [override])

    // Refeição 0 substituída
    expect(result[0].foods).toHaveLength(2)
    expect(result[0].foods[0].name).toBe('Sonho')
    expect(result[0].foods[1].name).toBe('Café com leite')
    // Totais recalculados
    expect(result[0].totalCalories).toBe(470) // 350 + 120
  })

  it('should recalculate meal totalCalories from edited foods', () => {
    const meals = makeMeals()

    const override: IMealOverride = {
      mealIndex: 1,
      originalFoods: meals[1].foods,
      editedFoods: [
        { name: 'Pizza', quantity: '2 fatias', calories: 500, protein: 20, carbs: 60, fat: 22 },
      ],
      totalCalories: 500,
      totalProtein: 20,
      totalCarbs: 60,
      totalFat: 22,
    }

    const result = applyMealOverrides(meals, [override])

    expect(result[1].totalCalories).toBe(500)
    expect(result[1].foods).toHaveLength(1)
    // Outras refeições intocadas
    expect(result[0].totalCalories).toBe(400)
    expect(result[2].totalCalories).toBe(500)
  })

  it('should handle multiple overrides on different meals', () => {
    const meals = makeMeals()

    const overrides: IMealOverride[] = [
      {
        mealIndex: 0,
        originalFoods: meals[0].foods,
        editedFoods: [{ name: 'Sonho', quantity: '1', calories: 300, protein: 4, carbs: 40, fat: 15 }],
        totalCalories: 300, totalProtein: 4, totalCarbs: 40, totalFat: 15,
      },
      {
        mealIndex: 2,
        originalFoods: meals[2].foods,
        editedFoods: [{ name: 'Hambúrguer', quantity: '1', calories: 700, protein: 35, carbs: 50, fat: 40 }],
        totalCalories: 700, totalProtein: 35, totalCarbs: 50, totalFat: 40,
      },
    ]

    const result = applyMealOverrides(meals, overrides)

    expect(result[0].foods[0].name).toBe('Sonho')
    expect(result[0].totalCalories).toBe(300)
    expect(result[1].foods[0].name).toBe('Arroz') // Intocada
    expect(result[2].foods[0].name).toBe('Hambúrguer')
    expect(result[2].totalCalories).toBe(700)
  })

  it('should silently skip invalid mealIndex', () => {
    const meals = makeMeals()

    const override: IMealOverride = {
      mealIndex: 99,
      originalFoods: [],
      editedFoods: [{ name: 'Teste', quantity: '1', calories: 100, protein: 1, carbs: 1, fat: 1 }],
      totalCalories: 100, totalProtein: 1, totalCarbs: 1, totalFat: 1,
    }

    const result = applyMealOverrides(meals, [override])

    // Nada mudou
    expect(result[0].foods[0].name).toBe('Pão integral')
    expect(result[1].foods[0].name).toBe('Arroz')
    expect(result[2].foods[0].name).toBe('Salmão')
  })
})
