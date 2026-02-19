import { describe, it, expect } from 'vitest'
import {
  sumMicronutrients,
  calculateRdaPercentages,
  getMicroAlerts,
  ZERO_MICROS,
  MICRO_KEYS,
  RDA,
  MICRO_META,
  HIGH_ALERT_KEYS,
  type IMicronutrients,
  type MicroKey,
} from '../micronutrients.js'

// Helper: cria micros com override sobre zeros
function makeMicros(overrides: Partial<IMicronutrients> = {}): IMicronutrients {
  return { ...ZERO_MICROS, ...overrides }
}

// Helper: cria percentuais com 80% pra tudo e overrides específicos
function makePcts(overrides: Partial<Record<MicroKey, number>> = {}): Record<MicroKey, number> {
  const base = {} as Record<MicroKey, number>
  for (const key of MICRO_KEYS) base[key] = 80
  return { ...base, ...overrides }
}

// ====================================================
// sumMicronutrients
// ====================================================

describe('sumMicronutrients', () => {
  it('should return zero micros for empty list', () => {
    const result = sumMicronutrients([])
    expect(result).toEqual(ZERO_MICROS)
  })

  it('should sum micros from multiple foods', () => {
    const food1 = makeMicros({ fiber: 2.5, calcium: 50, iron: 1.2, omega3: 0.5, vitaminD: 3 })
    const food2 = makeMicros({ fiber: 1.5, calcium: 150, iron: 0.8, omega3: 1.0, vitaminD: 7 })

    const result = sumMicronutrients([food1, food2])

    expect(result.fiber).toBe(4)
    expect(result.calcium).toBe(200)
    expect(result.iron).toBe(2)
    expect(result.omega3).toBe(1.5)
    expect(result.vitaminD).toBe(10)
  })

  it('should sum new nutrients (B12, zinc, selenium, cholesterol)', () => {
    const food1 = makeMicros({ vitaminB12: 1.2, zinc: 3, selenium: 20, cholesterol: 186 })
    const food2 = makeMicros({ vitaminB12: 0.8, zinc: 2, selenium: 30, cholesterol: 50 })

    const result = sumMicronutrients([food1, food2])

    expect(result.vitaminB12).toBe(2)
    expect(result.zinc).toBe(5)
    expect(result.selenium).toBe(50)
    expect(result.cholesterol).toBe(236)
  })

  it('should handle partial micros (missing fields treated as 0)', () => {
    const partial = { fiber: 3, calcium: 100, vitaminK: 50 }

    const result = sumMicronutrients([partial])

    expect(result.fiber).toBe(3)
    expect(result.calcium).toBe(100)
    expect(result.vitaminK).toBe(50)
    expect(result.iron).toBe(0)
    expect(result.omega3).toBe(0)
    expect(result.cholesterol).toBe(0)
    expect(result.vitaminB12).toBe(0)
  })

  it('should handle undefined items in the list', () => {
    const food = makeMicros({ fiber: 5, calcium: 200, phosphorus: 150 })

    const result = sumMicronutrients([food, undefined, undefined])

    expect(result.fiber).toBe(5)
    expect(result.calcium).toBe(200)
    expect(result.phosphorus).toBe(150)
  })

  it('should round results to 1 decimal place', () => {
    const food1 = { fiber: 1.15 }
    const food2 = { fiber: 2.17 }

    const result = sumMicronutrients([food1, food2])

    expect(result.fiber).toBe(3.3)
  })
})

// ====================================================
// calculateRdaPercentages
// ====================================================

describe('calculateRdaPercentages', () => {
  it('should calculate percentages for MALE', () => {
    const totals = makeMicros({
      fiber: 19, calcium: 800, iron: 6, sodium: 1800,
      potassium: 2720, magnesium: 294, vitaminA: 675, vitaminC: 72,
      omega3: 0.8, vitaminD: 7.5, zinc: 5.5, selenium: 27.5,
    })

    const result = calculateRdaPercentages(totals, 'MALE')

    expect(result.fiber).toBe(50)       // 19/38
    expect(result.calcium).toBe(80)     // 800/1000
    expect(result.iron).toBe(75)        // 6/8
    expect(result.sodium).toBe(78)      // 1800/2300
    expect(result.omega3).toBe(50)      // 0.8/1.6
    expect(result.vitaminD).toBe(50)    // 7.5/15
    expect(result.zinc).toBe(50)        // 5.5/11
    expect(result.selenium).toBe(50)    // 27.5/55
  })

  it('should calculate percentages for FEMALE at 100% RDA', () => {
    const result = calculateRdaPercentages(RDA.FEMALE, 'FEMALE')

    for (const key of MICRO_KEYS) {
      expect(result[key]).toBe(100)
    }
  })

  it('should return 0 for zero totals', () => {
    const result = calculateRdaPercentages(ZERO_MICROS, 'MALE')

    for (const key of MICRO_KEYS) {
      expect(result[key]).toBe(0)
    }
  })

  it('should allow values above 100%', () => {
    const totals = makeMicros({
      fiber: 50, vitaminC: 200, cholesterol: 450,
    })

    const result = calculateRdaPercentages(totals, 'MALE')

    expect(result.fiber).toBe(132)       // 50/38
    expect(result.vitaminC).toBe(222)    // 200/90
    expect(result.cholesterol).toBe(150) // 450/300
  })
})

// ====================================================
// getMicroAlerts
// ====================================================

describe('getMicroAlerts', () => {
  it('should return empty for all micros at 70%+ (HIGH_ALERT at <=100%)', () => {
    const pcts = makePcts({ sodium: 90, cholesterol: 80 })
    expect(getMicroAlerts(pcts)).toEqual([])
  })

  it('should alert for micros below 70%', () => {
    const pcts = makePcts({ fiber: 50, vitaminD: 30, zinc: 69 })
    const alerts = getMicroAlerts(pcts)

    expect(alerts).toHaveLength(3)
    expect(alerts).toContainEqual({ key: 'fiber', percent: 50, type: 'low' })
    expect(alerts).toContainEqual({ key: 'vitaminD', percent: 30, type: 'low' })
    expect(alerts).toContainEqual({ key: 'zinc', percent: 69, type: 'low' })
  })

  it('should alert for sodium ABOVE 100% (high)', () => {
    const pcts = makePcts({ sodium: 130 })
    const alerts = getMicroAlerts(pcts)

    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toEqual({ key: 'sodium', percent: 130, type: 'high' })
  })

  it('should alert for cholesterol ABOVE 100% (high)', () => {
    const pcts = makePcts({ cholesterol: 150 })
    const alerts = getMicroAlerts(pcts)

    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toEqual({ key: 'cholesterol', percent: 150, type: 'high' })
  })

  it('should NOT alert for sodium or cholesterol at exactly 100%', () => {
    const pcts = makePcts({ sodium: 100, cholesterol: 100 })
    expect(getMicroAlerts(pcts)).toEqual([])
  })

  it('should NOT alert for low sodium or low cholesterol', () => {
    const pcts = makePcts({ sodium: 40, cholesterol: 20 })
    expect(getMicroAlerts(pcts)).toEqual([])
  })

  it('should handle mixed alerts (low + high sodium + high cholesterol)', () => {
    const pcts = makePcts({
      fiber: 30, vitaminB12: 50, sodium: 150, cholesterol: 120,
      vitaminD: 10, omega3: 40,
    })

    const alerts = getMicroAlerts(pcts)
    const lowAlerts = alerts.filter(a => a.type === 'low')
    const highAlerts = alerts.filter(a => a.type === 'high')

    expect(lowAlerts).toHaveLength(4)  // fiber, vitaminB12, vitaminD, omega3
    expect(highAlerts).toHaveLength(2) // sodium, cholesterol
  })
})

// ====================================================
// Constants
// ====================================================

describe('constants', () => {
  it('MICRO_KEYS should have 25 entries', () => {
    expect(MICRO_KEYS).toHaveLength(25)
  })

  it('ZERO_MICROS should have all keys at 0', () => {
    for (const key of MICRO_KEYS) {
      expect(ZERO_MICROS[key]).toBe(0)
    }
  })

  it('RDA should have both genders with all micro keys > 0', () => {
    for (const gender of ['MALE', 'FEMALE'] as const) {
      for (const key of MICRO_KEYS) {
        expect(RDA[gender][key]).toBeGreaterThan(0)
      }
    }
  })

  it('MICRO_META should have label, unit, and group for each key', () => {
    for (const key of MICRO_KEYS) {
      expect(MICRO_META[key].label).toBeTruthy()
      expect(MICRO_META[key].unit).toBeTruthy()
      expect(['other', 'vitamins', 'minerals']).toContain(MICRO_META[key].group)
    }
  })

  it('HIGH_ALERT_KEYS should contain sodium and cholesterol', () => {
    expect(HIGH_ALERT_KEYS).toContain('sodium')
    expect(HIGH_ALERT_KEYS).toContain('cholesterol')
    expect(HIGH_ALERT_KEYS).toHaveLength(2)
  })

  it('FEMALE iron RDA should be higher than MALE (menstruation)', () => {
    expect(RDA.FEMALE.iron).toBeGreaterThan(RDA.MALE.iron)
  })

  it('MALE zinc RDA should be higher than FEMALE', () => {
    expect(RDA.MALE.zinc).toBeGreaterThan(RDA.FEMALE.zinc)
  })

  it('groups should cover all 25 keys', () => {
    const others = MICRO_KEYS.filter(k => MICRO_META[k].group === 'other')
    const vitamins = MICRO_KEYS.filter(k => MICRO_META[k].group === 'vitamins')
    const minerals = MICRO_KEYS.filter(k => MICRO_META[k].group === 'minerals')

    expect(others).toHaveLength(3)
    expect(vitamins).toHaveLength(12)
    expect(minerals).toHaveLength(10)
    expect(others.length + vitamins.length + minerals.length).toBe(25)
  })
})
