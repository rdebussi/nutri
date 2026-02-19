import { describe, it, expect, vi } from 'vitest'

// ====================================================
// TESTES DE MICRONUTRIENTES (Frontend)
// ====================================================
// Testa a lógica de cálculo de % RDA, cores e alertas
// que é usada no componente MicronutrientsSummary.
//
// Como a lógica está dentro do componente Vue, extraímos
// e testamos as mesmas funções puras aqui. Se amanhã
// movermos para um composable, os testes já existem.

// --------------------------------------------------
// Reprodução da lógica do componente (funções puras)
// --------------------------------------------------

type Micronutrients = {
  fiber: number
  calcium: number
  iron: number
  sodium: number
  potassium: number
  magnesium: number
  vitaminA: number
  vitaminC: number
}

type Gender = 'MALE' | 'FEMALE'
type MicroKey = keyof Micronutrients

const RDA: Record<Gender, Micronutrients> = {
  MALE: { fiber: 38, calcium: 1000, iron: 8, sodium: 2300, potassium: 3400, magnesium: 420, vitaminA: 900, vitaminC: 90 },
  FEMALE: { fiber: 25, calcium: 1000, iron: 18, sodium: 2300, potassium: 2600, magnesium: 320, vitaminA: 700, vitaminC: 75 },
}

const MICRO_KEYS: MicroKey[] = ['fiber', 'calcium', 'iron', 'sodium', 'potassium', 'magnesium', 'vitaminA', 'vitaminC']

function getColor(key: MicroKey, percent: number): string {
  if (key === 'sodium') {
    if (percent <= 100) return 'emerald'
    if (percent <= 130) return 'amber'
    return 'red'
  }
  if (percent >= 70) return 'emerald'
  if (percent >= 50) return 'amber'
  return 'red'
}

function calculateItems(micronutrients: Micronutrients, gender: Gender) {
  const rda = RDA[gender]
  return MICRO_KEYS.map(key => {
    const value = Math.round(micronutrients[key] * 10) / 10
    const rdaValue = rda[key]
    const percent = rdaValue > 0 ? Math.round((value / rdaValue) * 100) : 0
    return {
      key,
      value,
      rdaValue,
      percent,
      barWidth: Math.min(percent, 150),
      color: getColor(key, percent),
    }
  })
}

function countAlerts(items: ReturnType<typeof calculateItems>): number {
  return items.filter(i =>
    i.key === 'sodium' ? i.percent > 100 : i.percent < 70,
  ).length
}

// ====================================================
// getColor — lógica de cores por status
// ====================================================

describe('getColor — nutrientes normais', () => {
  it('should return emerald for >= 70%', () => {
    expect(getColor('fiber', 70)).toBe('emerald')
    expect(getColor('calcium', 100)).toBe('emerald')
    expect(getColor('iron', 150)).toBe('emerald')
  })

  it('should return amber for 50-69%', () => {
    expect(getColor('fiber', 50)).toBe('amber')
    expect(getColor('calcium', 69)).toBe('amber')
  })

  it('should return red for < 50%', () => {
    expect(getColor('fiber', 49)).toBe('red')
    expect(getColor('calcium', 0)).toBe('red')
    expect(getColor('iron', 30)).toBe('red')
  })
})

describe('getColor — sódio (invertido)', () => {
  it('should return emerald for <= 100%', () => {
    expect(getColor('sodium', 0)).toBe('emerald')
    expect(getColor('sodium', 50)).toBe('emerald')
    expect(getColor('sodium', 100)).toBe('emerald')
  })

  it('should return amber for 101-130%', () => {
    expect(getColor('sodium', 101)).toBe('amber')
    expect(getColor('sodium', 130)).toBe('amber')
  })

  it('should return red for > 130%', () => {
    expect(getColor('sodium', 131)).toBe('red')
    expect(getColor('sodium', 200)).toBe('red')
  })
})

// ====================================================
// calculateItems — cálculo de % RDA
// ====================================================

describe('calculateItems — percentuais RDA', () => {
  it('should calculate correct percentages for MALE', () => {
    // Exatamente 50% de todos os micros para MALE
    const micros: Micronutrients = {
      fiber: 19,
      calcium: 500,
      iron: 4,
      sodium: 1150,
      potassium: 1700,
      magnesium: 210,
      vitaminA: 450,
      vitaminC: 45,
    }

    const items = calculateItems(micros, 'MALE')

    expect(items.find(i => i.key === 'fiber')!.percent).toBe(50)
    expect(items.find(i => i.key === 'calcium')!.percent).toBe(50)
    expect(items.find(i => i.key === 'iron')!.percent).toBe(50)
    expect(items.find(i => i.key === 'sodium')!.percent).toBe(50)
    expect(items.find(i => i.key === 'potassium')!.percent).toBe(50)
    expect(items.find(i => i.key === 'magnesium')!.percent).toBe(50)
    expect(items.find(i => i.key === 'vitaminA')!.percent).toBe(50)
    expect(items.find(i => i.key === 'vitaminC')!.percent).toBe(50)
  })

  it('should calculate correct percentages for FEMALE', () => {
    // 100% da RDA feminina
    const micros: Micronutrients = {
      fiber: 25,
      calcium: 1000,
      iron: 18,
      sodium: 2300,
      potassium: 2600,
      magnesium: 320,
      vitaminA: 700,
      vitaminC: 75,
    }

    const items = calculateItems(micros, 'FEMALE')

    for (const item of items) {
      expect(item.percent).toBe(100)
    }
  })

  it('should use correct gender-specific RDA (iron differs)', () => {
    // 8mg de ferro: 100% MALE, 44% FEMALE
    const micros: Micronutrients = {
      fiber: 0, calcium: 0, iron: 8, sodium: 0,
      potassium: 0, magnesium: 0, vitaminA: 0, vitaminC: 0,
    }

    const maleItems = calculateItems(micros, 'MALE')
    const femaleItems = calculateItems(micros, 'FEMALE')

    expect(maleItems.find(i => i.key === 'iron')!.percent).toBe(100)
    expect(femaleItems.find(i => i.key === 'iron')!.percent).toBe(44) // 8/18 ≈ 44%
  })

  it('should cap barWidth at 150', () => {
    const micros: Micronutrients = {
      fiber: 0, calcium: 0, iron: 0, sodium: 0,
      potassium: 0, magnesium: 0, vitaminA: 0, vitaminC: 200, // 200/90 = 222%
    }

    const items = calculateItems(micros, 'MALE')
    const vitC = items.find(i => i.key === 'vitaminC')!

    expect(vitC.percent).toBe(222)
    expect(vitC.barWidth).toBe(150) // capped
  })

  it('should handle zero micros', () => {
    const micros: Micronutrients = {
      fiber: 0, calcium: 0, iron: 0, sodium: 0,
      potassium: 0, magnesium: 0, vitaminA: 0, vitaminC: 0,
    }

    const items = calculateItems(micros, 'MALE')

    for (const item of items) {
      expect(item.percent).toBe(0)
      expect(item.color).toBe(item.key === 'sodium' ? 'emerald' : 'red')
    }
  })

  it('should round values to 1 decimal', () => {
    const micros: Micronutrients = {
      fiber: 12.345, calcium: 0, iron: 0, sodium: 0,
      potassium: 0, magnesium: 0, vitaminA: 0, vitaminC: 0,
    }

    const items = calculateItems(micros, 'MALE')
    expect(items.find(i => i.key === 'fiber')!.value).toBe(12.3)
  })

  it('should return all 8 micronutrient items', () => {
    const micros: Micronutrients = {
      fiber: 0, calcium: 0, iron: 0, sodium: 0,
      potassium: 0, magnesium: 0, vitaminA: 0, vitaminC: 0,
    }

    const items = calculateItems(micros, 'MALE')

    expect(items).toHaveLength(8)
    expect(items.map(i => i.key)).toEqual(MICRO_KEYS)
  })
})

// ====================================================
// Cores integradas com calculateItems
// ====================================================

describe('calculateItems — cores por faixa', () => {
  it('should color-code a balanced diet (all green)', () => {
    // 80% de todos os micros para MALE, sódio a 80%
    const micros: Micronutrients = {
      fiber: 30.4,    // 80% of 38
      calcium: 800,   // 80% of 1000
      iron: 6.4,      // 80% of 8
      sodium: 1840,   // 80% of 2300
      potassium: 2720, // 80% of 3400
      magnesium: 336,  // 80% of 420
      vitaminA: 720,   // 80% of 900
      vitaminC: 72,    // 80% of 90
    }

    const items = calculateItems(micros, 'MALE')

    for (const item of items) {
      expect(item.color).toBe('emerald')
    }
  })

  it('should mark low micros as amber/red and high sodium as amber/red', () => {
    const micros: Micronutrients = {
      fiber: 10,       // 10/38 = 26% → red
      calcium: 600,    // 600/1000 = 60% → amber
      iron: 6,         // 6/8 = 75% → emerald
      sodium: 3000,    // 3000/2300 = 130% → amber
      potassium: 1000, // 1000/3400 = 29% → red
      magnesium: 420,  // 420/420 = 100% → emerald
      vitaminA: 500,   // 500/900 = 56% → amber
      vitaminC: 90,    // 90/90 = 100% → emerald
    }

    const items = calculateItems(micros, 'MALE')

    expect(items.find(i => i.key === 'fiber')!.color).toBe('red')
    expect(items.find(i => i.key === 'calcium')!.color).toBe('amber')
    expect(items.find(i => i.key === 'iron')!.color).toBe('emerald')
    expect(items.find(i => i.key === 'sodium')!.color).toBe('amber')
    expect(items.find(i => i.key === 'potassium')!.color).toBe('red')
    expect(items.find(i => i.key === 'magnesium')!.color).toBe('emerald')
    expect(items.find(i => i.key === 'vitaminA')!.color).toBe('amber')
    expect(items.find(i => i.key === 'vitaminC')!.color).toBe('emerald')
  })
})

// ====================================================
// countAlerts — contagem de alertas
// ====================================================

describe('countAlerts', () => {
  it('should return 0 when all micros are adequate', () => {
    const micros: Micronutrients = {
      fiber: 30, calcium: 800, iron: 7, sodium: 1800,
      potassium: 2800, magnesium: 350, vitaminA: 700, vitaminC: 70,
    }
    const items = calculateItems(micros, 'MALE')
    expect(countAlerts(items)).toBe(0)
  })

  it('should count low micros (< 70% RDA)', () => {
    const micros: Micronutrients = {
      fiber: 10,     // 26% → alert
      calcium: 200,  // 20% → alert
      iron: 7,       // 88% → ok
      sodium: 1000,  // 43% → ok (sodium low is fine)
      potassium: 1000, // 29% → alert
      magnesium: 100,  // 24% → alert
      vitaminA: 800,   // 89% → ok
      vitaminC: 80,    // 89% → ok
    }
    const items = calculateItems(micros, 'MALE')
    expect(countAlerts(items)).toBe(4)
  })

  it('should count high sodium (> 100% RDA)', () => {
    const micros: Micronutrients = {
      fiber: 38, calcium: 1000, iron: 8, sodium: 3000,
      potassium: 3400, magnesium: 420, vitaminA: 900, vitaminC: 90,
    }
    const items = calculateItems(micros, 'MALE')
    expect(countAlerts(items)).toBe(1) // only sodium
  })

  it('should count both low micros and high sodium', () => {
    const micros: Micronutrients = {
      fiber: 5,       // 13% → alert
      calcium: 100,   // 10% → alert
      iron: 1,        // 13% → alert
      sodium: 3500,   // 152% → alert
      potassium: 500, // 15% → alert
      magnesium: 50,  // 12% → alert
      vitaminA: 100,  // 11% → alert
      vitaminC: 10,   // 11% → alert
    }
    const items = calculateItems(micros, 'MALE')
    expect(countAlerts(items)).toBe(8) // all alerting
  })

  it('should NOT alert sodium at exactly 100%', () => {
    const micros: Micronutrients = {
      fiber: 38, calcium: 1000, iron: 8, sodium: 2300,
      potassium: 3400, magnesium: 420, vitaminA: 900, vitaminC: 90,
    }
    const items = calculateItems(micros, 'MALE')
    expect(countAlerts(items)).toBe(0)
  })
})

// ====================================================
// RDA constants validation
// ====================================================

describe('RDA constants', () => {
  it('should have all 8 keys for MALE', () => {
    for (const key of MICRO_KEYS) {
      expect(RDA.MALE[key]).toBeGreaterThan(0)
    }
  })

  it('should have all 8 keys for FEMALE', () => {
    for (const key of MICRO_KEYS) {
      expect(RDA.FEMALE[key]).toBeGreaterThan(0)
    }
  })

  it('FEMALE iron RDA should be higher than MALE', () => {
    expect(RDA.FEMALE.iron).toBeGreaterThan(RDA.MALE.iron)
  })

  it('sodium RDA should be equal for both genders', () => {
    expect(RDA.MALE.sodium).toBe(RDA.FEMALE.sodium)
  })

  it('calcium RDA should be equal for both genders', () => {
    expect(RDA.MALE.calcium).toBe(RDA.FEMALE.calcium)
  })
})
