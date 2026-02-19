import { describe, it, expect } from 'vitest'

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
  fiber: number; omega3: number; cholesterol: number
  vitaminA: number; vitaminB1: number; vitaminB2: number; vitaminB3: number
  vitaminB5: number; vitaminB6: number; vitaminB9: number; vitaminB12: number
  vitaminC: number; vitaminD: number; vitaminE: number; vitaminK: number
  calcium: number; iron: number; magnesium: number; phosphorus: number
  potassium: number; sodium: number; zinc: number; copper: number
  manganese: number; selenium: number
}

type Gender = 'MALE' | 'FEMALE'
type MicroKey = keyof Micronutrients
type MicroGroup = 'other' | 'vitamins' | 'minerals'

const RDA: Record<Gender, Micronutrients> = {
  MALE: {
    fiber: 38, omega3: 1.6, cholesterol: 300,
    vitaminA: 900, vitaminB1: 1.2, vitaminB2: 1.3, vitaminB3: 16, vitaminB5: 5,
    vitaminB6: 1.3, vitaminB9: 400, vitaminB12: 2.4, vitaminC: 90, vitaminD: 15,
    vitaminE: 15, vitaminK: 120,
    calcium: 1000, iron: 8, magnesium: 420, phosphorus: 700, potassium: 3400,
    sodium: 2300, zinc: 11, copper: 0.9, manganese: 2.3, selenium: 55,
  },
  FEMALE: {
    fiber: 25, omega3: 1.1, cholesterol: 300,
    vitaminA: 700, vitaminB1: 1.1, vitaminB2: 1.1, vitaminB3: 14, vitaminB5: 5,
    vitaminB6: 1.3, vitaminB9: 400, vitaminB12: 2.4, vitaminC: 75, vitaminD: 15,
    vitaminE: 15, vitaminK: 90,
    calcium: 1000, iron: 18, magnesium: 320, phosphorus: 700, potassium: 2600,
    sodium: 2300, zinc: 8, copper: 0.9, manganese: 1.8, selenium: 55,
  },
}

const MICRO_KEYS: MicroKey[] = [
  'fiber', 'omega3', 'cholesterol',
  'vitaminA', 'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB5', 'vitaminB6',
  'vitaminB9', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK',
  'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium',
  'zinc', 'copper', 'manganese', 'selenium',
]

const HIGH_ALERT_KEYS: MicroKey[] = ['sodium', 'cholesterol']

// Helper: cria micros com zeros + overrides
const ZERO_MICROS: Micronutrients = {
  fiber: 0, omega3: 0, cholesterol: 0,
  vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
  vitaminB6: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0, vitaminD: 0,
  vitaminE: 0, vitaminK: 0,
  calcium: 0, iron: 0, magnesium: 0, phosphorus: 0, potassium: 0,
  sodium: 0, zinc: 0, copper: 0, manganese: 0, selenium: 0,
}

function makeMicros(overrides: Partial<Micronutrients> = {}): Micronutrients {
  return { ...ZERO_MICROS, ...overrides }
}

function getColor(key: MicroKey, percent: number): string {
  if (HIGH_ALERT_KEYS.includes(key)) {
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
    const value = Math.round((micronutrients[key] ?? 0) * 10) / 10
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
    HIGH_ALERT_KEYS.includes(i.key as MicroKey) ? i.percent > 100 : i.percent < 70,
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

describe('getColor — colesterol (invertido)', () => {
  it('should return emerald for <= 100%', () => {
    expect(getColor('cholesterol', 0)).toBe('emerald')
    expect(getColor('cholesterol', 80)).toBe('emerald')
    expect(getColor('cholesterol', 100)).toBe('emerald')
  })

  it('should return amber for 101-130%', () => {
    expect(getColor('cholesterol', 101)).toBe('amber')
    expect(getColor('cholesterol', 130)).toBe('amber')
  })

  it('should return red for > 130%', () => {
    expect(getColor('cholesterol', 131)).toBe('red')
    expect(getColor('cholesterol', 200)).toBe('red')
  })
})

// ====================================================
// calculateItems — cálculo de % RDA
// ====================================================

describe('calculateItems — percentuais RDA', () => {
  it('should calculate correct percentages for MALE (sample)', () => {
    const micros = makeMicros({
      fiber: 19, calcium: 500, iron: 4, sodium: 1150,
      potassium: 1700, magnesium: 210, vitaminA: 450, vitaminC: 45,
    })

    const items = calculateItems(micros, 'MALE')

    expect(items.find(i => i.key === 'fiber')!.percent).toBe(50)
    expect(items.find(i => i.key === 'calcium')!.percent).toBe(50)
    expect(items.find(i => i.key === 'iron')!.percent).toBe(50)
    expect(items.find(i => i.key === 'sodium')!.percent).toBe(50)
  })

  it('should calculate correct percentages for FEMALE at 100%', () => {
    const items = calculateItems(RDA.FEMALE, 'FEMALE')

    for (const item of items) {
      expect(item.percent).toBe(100)
    }
  })

  it('should use correct gender-specific RDA (iron differs)', () => {
    const micros = makeMicros({ iron: 8 })

    const maleItems = calculateItems(micros, 'MALE')
    const femaleItems = calculateItems(micros, 'FEMALE')

    expect(maleItems.find(i => i.key === 'iron')!.percent).toBe(100)
    expect(femaleItems.find(i => i.key === 'iron')!.percent).toBe(44) // 8/18 ≈ 44%
  })

  it('should calculate new nutrients (vitaminD, zinc, selenium)', () => {
    const micros = makeMicros({ vitaminD: 7.5, zinc: 5.5, selenium: 27.5 })

    const items = calculateItems(micros, 'MALE')

    expect(items.find(i => i.key === 'vitaminD')!.percent).toBe(50)   // 7.5/15
    expect(items.find(i => i.key === 'zinc')!.percent).toBe(50)       // 5.5/11
    expect(items.find(i => i.key === 'selenium')!.percent).toBe(50)   // 27.5/55
  })

  it('should calculate cholesterol percentage', () => {
    const micros = makeMicros({ cholesterol: 450 })

    const items = calculateItems(micros, 'MALE')
    const chol = items.find(i => i.key === 'cholesterol')!

    expect(chol.percent).toBe(150) // 450/300
    expect(chol.color).toBe('red') // > 130%
  })

  it('should cap barWidth at 150', () => {
    const micros = makeMicros({ vitaminC: 200 }) // 200/90 = 222%

    const items = calculateItems(micros, 'MALE')
    const vitC = items.find(i => i.key === 'vitaminC')!

    expect(vitC.percent).toBe(222)
    expect(vitC.barWidth).toBe(150) // capped
  })

  it('should handle zero micros', () => {
    const items = calculateItems(ZERO_MICROS, 'MALE')

    for (const item of items) {
      expect(item.percent).toBe(0)
      if (HIGH_ALERT_KEYS.includes(item.key as MicroKey)) {
        expect(item.color).toBe('emerald') // low sodium/cholesterol is good
      } else {
        expect(item.color).toBe('red') // low everything else is bad
      }
    }
  })

  it('should round values to 1 decimal', () => {
    const micros = makeMicros({ fiber: 12.345 })

    const items = calculateItems(micros, 'MALE')
    expect(items.find(i => i.key === 'fiber')!.value).toBe(12.3)
  })

  it('should return all 25 micronutrient items', () => {
    const items = calculateItems(ZERO_MICROS, 'MALE')

    expect(items).toHaveLength(25)
    expect(items.map(i => i.key)).toEqual(MICRO_KEYS)
  })
})

// ====================================================
// Cores integradas com calculateItems
// ====================================================

describe('calculateItems — cores por faixa', () => {
  it('should color-code a balanced diet (all green)', () => {
    // 80% de todos os micros para MALE
    const micros = makeMicros({
      fiber: 30.4, omega3: 1.28, cholesterol: 240,
      vitaminA: 720, vitaminB1: 0.96, vitaminB2: 1.04, vitaminB3: 12.8, vitaminB5: 4,
      vitaminB6: 1.04, vitaminB9: 320, vitaminB12: 1.92, vitaminC: 72, vitaminD: 12,
      vitaminE: 12, vitaminK: 96,
      calcium: 800, iron: 6.4, magnesium: 336, phosphorus: 560, potassium: 2720,
      sodium: 1840, zinc: 8.8, copper: 0.72, manganese: 1.84, selenium: 44,
    })

    const items = calculateItems(micros, 'MALE')

    for (const item of items) {
      expect(item.color).toBe('emerald')
    }
  })

  it('should mark low micros as red and high sodium/cholesterol as red', () => {
    const micros = makeMicros({
      fiber: 10,        // 26% → red
      sodium: 3500,     // 152% → red
      cholesterol: 500, // 167% → red
    })

    const items = calculateItems(micros, 'MALE')

    expect(items.find(i => i.key === 'fiber')!.color).toBe('red')
    expect(items.find(i => i.key === 'sodium')!.color).toBe('red')
    expect(items.find(i => i.key === 'cholesterol')!.color).toBe('red')
  })
})

// ====================================================
// countAlerts — contagem de alertas
// ====================================================

describe('countAlerts', () => {
  it('should return 0 when all micros are adequate', () => {
    // 80% de tudo, sodium/cholesterol a 80% (abaixo de 100%)
    const micros = makeMicros({
      fiber: 30.4, omega3: 1.28, cholesterol: 240,
      vitaminA: 720, vitaminB1: 0.96, vitaminB2: 1.04, vitaminB3: 12.8, vitaminB5: 4,
      vitaminB6: 1.04, vitaminB9: 320, vitaminB12: 1.92, vitaminC: 72, vitaminD: 12,
      vitaminE: 12, vitaminK: 96,
      calcium: 800, iron: 6.4, magnesium: 336, phosphorus: 560, potassium: 2720,
      sodium: 1840, zinc: 8.8, copper: 0.72, manganese: 1.84, selenium: 44,
    })
    const items = calculateItems(micros, 'MALE')
    expect(countAlerts(items)).toBe(0)
  })

  it('should count low micros (< 70% RDA)', () => {
    const micros = makeMicros({
      fiber: 10, calcium: 200, iron: 7, potassium: 1000, magnesium: 100,
      // Resto em 0 → 20 campos com 0 → todos dão alerta exceto sodium/cholesterol
    })
    const items = calculateItems(micros, 'MALE')
    // 23 normal nutrients at < 70% = alert. sodium + cholesterol at 0 = ok (no high alert)
    const lowAlerts = items.filter(i => !HIGH_ALERT_KEYS.includes(i.key as MicroKey) && i.percent < 70)
    expect(lowAlerts.length).toBeGreaterThan(15) // many alerts
  })

  it('should count high sodium (> 100% RDA)', () => {
    const micros = { ...RDA.MALE, sodium: 3000 } // all perfect except sodium
    const items = calculateItems(micros, 'MALE')
    expect(countAlerts(items)).toBe(1) // only sodium
  })

  it('should count high cholesterol (> 100% RDA)', () => {
    const micros = { ...RDA.MALE, cholesterol: 500 } // all perfect except cholesterol
    const items = calculateItems(micros, 'MALE')
    expect(countAlerts(items)).toBe(1) // only cholesterol
  })

  it('should NOT alert sodium at exactly 100%', () => {
    const items = calculateItems(RDA.MALE, 'MALE')
    expect(countAlerts(items)).toBe(0)
  })

  it('should NOT alert cholesterol at exactly 100%', () => {
    const items = calculateItems(RDA.MALE, 'MALE')
    const chol = items.find(i => i.key === 'cholesterol')!
    expect(chol.percent).toBe(100)
    expect(chol.color).toBe('emerald')
  })
})

// ====================================================
// RDA constants validation
// ====================================================

describe('RDA constants', () => {
  it('should have all 25 keys for MALE', () => {
    for (const key of MICRO_KEYS) {
      expect(RDA.MALE[key]).toBeGreaterThan(0)
    }
  })

  it('should have all 25 keys for FEMALE', () => {
    for (const key of MICRO_KEYS) {
      expect(RDA.FEMALE[key]).toBeGreaterThan(0)
    }
  })

  it('FEMALE iron RDA should be higher than MALE', () => {
    expect(RDA.FEMALE.iron).toBeGreaterThan(RDA.MALE.iron)
  })

  it('MALE zinc RDA should be higher than FEMALE', () => {
    expect(RDA.MALE.zinc).toBeGreaterThan(RDA.FEMALE.zinc)
  })

  it('sodium RDA should be equal for both genders', () => {
    expect(RDA.MALE.sodium).toBe(RDA.FEMALE.sodium)
  })

  it('cholesterol RDA should be equal for both genders', () => {
    expect(RDA.MALE.cholesterol).toBe(RDA.FEMALE.cholesterol)
  })

  it('MICRO_KEYS should have 25 entries', () => {
    expect(MICRO_KEYS).toHaveLength(25)
  })
})
