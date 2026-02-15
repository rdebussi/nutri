import { describe, it, expect } from 'vitest'
import {
  parseQuantity,
  scaleQuantity,
  recalculateMeals,
  type RecalculationInput,
} from '../meal-recalculator.js'
import type { IMeal } from '../../../modules/diet/diet.model.js'

// ====================================================
// TESTES DO MOTOR DE RECÁLCULO
// ====================================================
// Funções puras que redistribuem macros/calorias quando
// o usuário pula uma refeição ou faz exercício extra.

// Helper: cria uma refeição de teste
function makeMeal(name: string, time: string, calories: number, protein: number, carbs: number, fat: number): IMeal {
  return {
    name,
    time,
    foods: [
      { name: 'Alimento A', quantity: '100g', calories: calories * 0.6, protein: protein * 0.6, carbs: carbs * 0.6, fat: fat * 0.6 },
      { name: 'Alimento B', quantity: '50g', calories: calories * 0.4, protein: protein * 0.4, carbs: carbs * 0.4, fat: fat * 0.4 },
    ],
    totalCalories: calories,
  }
}

// Dieta exemplo: 5 refeições, ~2300 kcal total
const sampleMeals: IMeal[] = [
  makeMeal('Café da manhã', '07:00', 400, 25, 50, 12),
  makeMeal('Lanche da manhã', '10:00', 200, 10, 25, 8),
  makeMeal('Almoço', '12:30', 700, 45, 80, 22),
  makeMeal('Lanche da tarde', '16:00', 300, 15, 35, 10),
  makeMeal('Jantar', '20:00', 600, 40, 65, 18),
]

const dailyTargets = { calories: 2200, protein: 135, carbs: 255, fat: 70 }

// ====================================================
// parseQuantity
// ====================================================
describe('parseQuantity', () => {
  it('parseia "150g" corretamente', () => {
    expect(parseQuantity('150g')).toEqual({ value: 150, unit: 'g' })
  })

  it('parseia "200ml" corretamente', () => {
    expect(parseQuantity('200ml')).toEqual({ value: 200, unit: 'ml' })
  })

  it('parseia "2 fatias" corretamente', () => {
    expect(parseQuantity('2 fatias')).toEqual({ value: 2, unit: 'fatias' })
  })

  it('parseia "1.5 xícara" com decimal', () => {
    expect(parseQuantity('1.5 xícara')).toEqual({ value: 1.5, unit: 'xícara' })
  })

  it('parseia "100 g" com espaço entre número e unidade', () => {
    expect(parseQuantity('100 g')).toEqual({ value: 100, unit: 'g' })
  })

  it('retorna fallback para texto sem número', () => {
    expect(parseQuantity('a gosto')).toEqual({ value: 0, unit: 'a gosto' })
  })

  it('parseia "1,5 colher" com vírgula brasileira', () => {
    expect(parseQuantity('1,5 colher')).toEqual({ value: 1.5, unit: 'colher' })
  })
})

// ====================================================
// scaleQuantity
// ====================================================
describe('scaleQuantity', () => {
  it('escala "150g" por 1.2 → "180g"', () => {
    expect(scaleQuantity('150g', 1.2)).toBe('180g')
  })

  it('escala "200ml" por 1.15 → "230ml"', () => {
    expect(scaleQuantity('200ml', 1.15)).toBe('230ml')
  })

  it('escala "100g" por 1.0 → "100g" (sem mudança)', () => {
    expect(scaleQuantity('100g', 1.0)).toBe('100g')
  })

  it('arredonda para inteiro em unidades discretas como "fatias"', () => {
    expect(scaleQuantity('2 fatias', 1.3)).toBe('3 fatias')
  })

  it('mantém texto sem número inalterado', () => {
    expect(scaleQuantity('a gosto', 1.5)).toBe('a gosto')
  })

  it('escala com fator menor que 1 (redução)', () => {
    expect(scaleQuantity('200g', 0.8)).toBe('160g')
  })
})

// ====================================================
// recalculateMeals — cenários principais
// ====================================================
describe('recalculateMeals', () => {
  it('retorna refeições inalteradas quando tudo está pending', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'pending',
        'Lanche da manhã': 'pending',
        'Almoço': 'pending',
        'Lanche da tarde': 'pending',
        'Jantar': 'pending',
      },
      dailyTargets,
      extraCaloriesBurned: 0,
    }

    const result = recalculateMeals(input)

    // Todas pendentes → scaleFactor = dailyTargets / totalOriginal
    // Refeições adaptadas mas com escala baseada no target
    expect(result.adaptedMeals).toHaveLength(5)
    expect(result.summary.consumed.calories).toBe(0)
    expect(result.summary.exerciseBonus).toBe(0)
  })

  it('redistribui macros quando uma refeição é pulada', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'completed',
        'Lanche da manhã': 'skipped',
        'Almoço': 'pending',
        'Lanche da tarde': 'pending',
        'Jantar': 'pending',
      },
      dailyTargets,
      extraCaloriesBurned: 0,
    }

    const result = recalculateMeals(input)

    // consumed = café da manhã = 400 kcal
    expect(result.summary.consumed.calories).toBe(400)

    // remaining = 2200 - 400 = 1800
    expect(result.summary.remaining.calories).toBe(1800)

    // 3 refeições pendentes: almoço(700) + lanche tarde(300) + jantar(600) = 1600
    // scaleFactor = 1800 / 1600 = 1.125
    const pendingMeals = result.adaptedMeals.filter(m => m.adapted)
    expect(pendingMeals).toHaveLength(3)

    // Cada meal pendente deve ter calorias escaladas para cima
    const almoco = pendingMeals.find(m => m.name === 'Almoço')!
    expect(almoco.totalCalories).toBeGreaterThan(700)
    expect(almoco.scaleFactor).toBeCloseTo(1.125, 2)

    // Total das adaptadas ≈ remaining (±5 kcal por arredondamento em cada meal)
    const totalAdapted = pendingMeals.reduce((sum, m) => sum + m.totalCalories, 0)
    expect(Math.abs(totalAdapted - 1800)).toBeLessThanOrEqual(5)
  })

  it('aumenta calorias quando há exercício extra', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'completed',
        'Lanche da manhã': 'completed',
        'Almoço': 'pending',
        'Lanche da tarde': 'pending',
        'Jantar': 'pending',
      },
      dailyTargets,
      extraCaloriesBurned: 300,
    }

    const result = recalculateMeals(input)

    // consumed = 400 + 200 = 600
    expect(result.summary.consumed.calories).toBe(600)
    expect(result.summary.exerciseBonus).toBe(300)

    // adjustedTarget = 2200 + 300 = 2500
    // remaining = 2500 - 600 = 1900
    expect(result.summary.dailyTarget.calories).toBe(2500)
    expect(result.summary.remaining.calories).toBe(1900)

    // 3 pendentes originais = 700 + 300 + 600 = 1600
    // scaleFactor = 1900 / 1600 = 1.1875
    const pendingMeals = result.adaptedMeals.filter(m => m.adapted)
    const totalAdapted = pendingMeals.reduce((sum, m) => sum + m.totalCalories, 0)
    expect(Math.abs(totalAdapted - 1900)).toBeLessThanOrEqual(5)
  })

  it('trata refeições completed como não-adaptadas (mantém original)', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'completed',
        'Lanche da manhã': 'pending',
        'Almoço': 'pending',
        'Lanche da tarde': 'pending',
        'Jantar': 'pending',
      },
      dailyTargets,
      extraCaloriesBurned: 0,
    }

    const result = recalculateMeals(input)

    const cafe = result.adaptedMeals.find(m => m.name === 'Café da manhã')!
    expect(cafe.adapted).toBe(false)
    expect(cafe.totalCalories).toBe(400) // original
    expect(cafe.scaleFactor).toBe(1)
  })

  it('trata refeições skipped como não incluídas no resultado', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'completed',
        'Lanche da manhã': 'skipped',
        'Almoço': 'pending',
        'Lanche da tarde': 'pending',
        'Jantar': 'pending',
      },
      dailyTargets,
      extraCaloriesBurned: 0,
    }

    const result = recalculateMeals(input)

    const lanche = result.adaptedMeals.find(m => m.name === 'Lanche da manhã')!
    expect(lanche.adapted).toBe(false)
    expect(lanche.totalCalories).toBe(0) // skipped = 0
  })

  it('edge case: todas as refeições completadas', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'completed',
        'Lanche da manhã': 'completed',
        'Almoço': 'completed',
        'Lanche da tarde': 'completed',
        'Jantar': 'completed',
      },
      dailyTargets,
      extraCaloriesBurned: 0,
    }

    const result = recalculateMeals(input)

    // Nenhuma pending → remaining é o que sobra
    const pending = result.adaptedMeals.filter(m => m.adapted)
    expect(pending).toHaveLength(0)
    expect(result.summary.consumed.calories).toBe(2200)
  })

  it('edge case: todas as refeições puladas → nenhuma pendente', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'skipped',
        'Lanche da manhã': 'skipped',
        'Almoço': 'skipped',
        'Lanche da tarde': 'skipped',
        'Jantar': 'skipped',
      },
      dailyTargets,
      extraCaloriesBurned: 0,
    }

    const result = recalculateMeals(input)

    expect(result.summary.consumed.calories).toBe(0)
    expect(result.summary.remaining.calories).toBe(2200)
    // Todas skipped → nenhuma adapted
    const adapted = result.adaptedMeals.filter(m => m.adapted)
    expect(adapted).toHaveLength(0)
  })

  it('escala as quantidades dos foods dentro de cada meal adaptada', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'completed',
        'Lanche da manhã': 'skipped',
        'Almoço': 'pending',
        'Lanche da tarde': 'pending',
        'Jantar': 'pending',
      },
      dailyTargets,
      extraCaloriesBurned: 0,
    }

    const result = recalculateMeals(input)

    const almoco = result.adaptedMeals.find(m => m.name === 'Almoço')!
    expect(almoco.adapted).toBe(true)
    // Foods devem ter quantidades escaladas
    expect(almoco.foods.length).toBe(2)
    // Alimento A original: "100g", escala ~1.125 → "113g"
    expect(almoco.foods[0].quantity).not.toBe('100g')
  })

  it('calcula protein, carbs e fat nos macros do summary', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'completed',
        'Lanche da manhã': 'pending',
        'Almoço': 'pending',
        'Lanche da tarde': 'pending',
        'Jantar': 'pending',
      },
      dailyTargets,
      extraCaloriesBurned: 0,
    }

    const result = recalculateMeals(input)

    expect(result.summary.consumed.protein).toBe(25)
    expect(result.summary.consumed.carbs).toBe(50)
    expect(result.summary.consumed.fat).toBe(12)
    expect(result.summary.remaining.protein).toBe(dailyTargets.protein - 25)
  })

  it('combina skip + exercício extra corretamente', () => {
    const input: RecalculationInput = {
      originalMeals: sampleMeals,
      mealStatuses: {
        'Café da manhã': 'completed',
        'Lanche da manhã': 'skipped',
        'Almoço': 'completed',
        'Lanche da tarde': 'pending',
        'Jantar': 'pending',
      },
      dailyTargets,
      extraCaloriesBurned: 200,
    }

    const result = recalculateMeals(input)

    // Café comido ANTES do skip → consumed = original = 400
    // Almoço comido DEPOIS do skip → consumed = valor adaptado
    //   adjustedTarget = 2200 + 200 = 2400
    //   budget após café = 2400 - 400 = 2000
    //   pool não-skipped não-processado = Almoço(700) + LancheT(300) + Jantar(600) = 1600
    //   sf = 2000 / 1600 = 1.25
    //   Almoço adaptado = 700 * 1.25 = 875
    // consumed total = 400 + 875 = 1275
    expect(result.summary.consumed.calories).toBe(1275)
    expect(result.summary.dailyTarget.calories).toBe(2400)
    // remaining = 2400 - 1275 = 1125
    expect(result.summary.remaining.calories).toBe(1125)

    // 2 pendentes: lanche tarde(300) + jantar(600) = 900
    // scaleFactor = 1125 / 900 = 1.25
    const pendingMeals = result.adaptedMeals.filter(m =>
      m.name === 'Lanche da tarde' || m.name === 'Jantar',
    )
    expect(pendingMeals.every(m => m.adapted)).toBe(true)
    const totalAdapted = pendingMeals.reduce((sum, m) => sum + m.totalCalories, 0)
    expect(Math.abs(totalAdapted - 1125)).toBeLessThanOrEqual(5)
  })

  it('completed após skip usa valor adaptado no consumed (Bug 2 fix)', () => {
    // Cenário: Skip café → come almoço adaptado → jantar pendente
    const threeMeals: IMeal[] = [
      makeMeal('Café', '07:00', 400, 25, 50, 12),
      makeMeal('Almoço', '12:00', 700, 45, 80, 22),
      makeMeal('Jantar', '20:00', 600, 40, 65, 18),
    ]

    const input: RecalculationInput = {
      originalMeals: threeMeals,
      mealStatuses: {
        'Café': 'skipped',
        'Almoço': 'completed',
        'Jantar': 'pending',
      },
      dailyTargets: { calories: 1700, protein: 110, carbs: 195, fat: 52 },
      extraCaloriesBurned: 0,
    }

    const result = recalculateMeals(input)

    // Café skipped → hadSkipBefore = true
    // Almoço completed após skip:
    //   pool = Almoço(700) + Jantar(600) = 1300
    //   sf = 1700 / 1300 ≈ 1.308
    //   consumed = 700 * 1.308 = 915 (arredondado)
    const almoco = result.adaptedMeals.find(m => m.name === 'Almoço')!
    expect(almoco.adapted).toBe(true)
    expect(almoco.totalCalories).toBeGreaterThan(700) // valor adaptado, não original

    // consumed deve ser o valor ADAPTADO, não o original
    expect(result.summary.consumed.calories).toBe(almoco.totalCalories)
    expect(result.summary.consumed.calories).toBeGreaterThan(700)

    // remaining = 1700 - consumed
    expect(result.summary.remaining.calories).toBe(1700 - almoco.totalCalories)

    // Jantar pendente deve receber o restante
    const jantar = result.adaptedMeals.find(m => m.name === 'Jantar')!
    expect(jantar.adapted).toBe(true)
    expect(jantar.totalCalories).toBe(1700 - almoco.totalCalories)

    // Total = consumed + pending = target
    expect(almoco.totalCalories + jantar.totalCalories).toBe(1700)
  })
})
