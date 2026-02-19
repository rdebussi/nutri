import { describe, it, expect } from 'vitest'
import {
  sumMicronutrients,
  calculateRdaPercentages,
  getMicroAlerts,
  ZERO_MICROS,
  MICRO_KEYS,
  RDA,
  MICRO_META,
  type IMicronutrients,
} from '../micronutrients.js'

// ====================================================
// sumMicronutrients
// ====================================================

describe('sumMicronutrients', () => {
  it('should return zero micros for empty list', () => {
    const result = sumMicronutrients([])
    expect(result).toEqual(ZERO_MICROS)
  })

  it('should sum micros from multiple foods', () => {
    const food1: IMicronutrients = {
      fiber: 2.5, calcium: 50, iron: 1.2, sodium: 100,
      potassium: 200, magnesium: 30, vitaminA: 50, vitaminC: 10,
    }
    const food2: IMicronutrients = {
      fiber: 1.5, calcium: 150, iron: 0.8, sodium: 200,
      potassium: 300, magnesium: 20, vitaminA: 100, vitaminC: 30,
    }

    const result = sumMicronutrients([food1, food2])

    expect(result.fiber).toBe(4)
    expect(result.calcium).toBe(200)
    expect(result.iron).toBe(2)
    expect(result.sodium).toBe(300)
    expect(result.potassium).toBe(500)
    expect(result.magnesium).toBe(50)
    expect(result.vitaminA).toBe(150)
    expect(result.vitaminC).toBe(40)
  })

  it('should handle partial micros (missing fields treated as 0)', () => {
    const partial = { fiber: 3, calcium: 100 } // sem os outros campos

    const result = sumMicronutrients([partial])

    expect(result.fiber).toBe(3)
    expect(result.calcium).toBe(100)
    expect(result.iron).toBe(0)
    expect(result.sodium).toBe(0)
    expect(result.potassium).toBe(0)
    expect(result.magnesium).toBe(0)
    expect(result.vitaminA).toBe(0)
    expect(result.vitaminC).toBe(0)
  })

  it('should handle undefined items in the list', () => {
    const food: IMicronutrients = {
      fiber: 5, calcium: 200, iron: 2, sodium: 400,
      potassium: 500, magnesium: 60, vitaminA: 150, vitaminC: 40,
    }

    const result = sumMicronutrients([food, undefined, undefined])

    expect(result.fiber).toBe(5)
    expect(result.calcium).toBe(200)
  })

  it('should round results to 1 decimal place', () => {
    const food1 = { fiber: 1.15 }
    const food2 = { fiber: 2.17 }

    const result = sumMicronutrients([food1, food2])

    // 1.15 + 2.17 = 3.32 → arredonda para 3.3
    expect(result.fiber).toBe(3.3)
  })
})

// ====================================================
// calculateRdaPercentages
// ====================================================

describe('calculateRdaPercentages', () => {
  it('should calculate percentages for MALE', () => {
    const totals: IMicronutrients = {
      fiber: 19, calcium: 800, iron: 6, sodium: 1800,
      potassium: 2720, magnesium: 294, vitaminA: 675, vitaminC: 72,
    }

    const result = calculateRdaPercentages(totals, 'MALE')

    expect(result.fiber).toBe(50)       // 19/38 = 50%
    expect(result.calcium).toBe(80)     // 800/1000 = 80%
    expect(result.iron).toBe(75)        // 6/8 = 75%
    expect(result.sodium).toBe(78)      // 1800/2300 ≈ 78%
    expect(result.potassium).toBe(80)   // 2720/3400 = 80%
    expect(result.magnesium).toBe(70)   // 294/420 = 70%
    expect(result.vitaminA).toBe(75)    // 675/900 = 75%
    expect(result.vitaminC).toBe(80)    // 72/90 = 80%
  })

  it('should calculate percentages for FEMALE', () => {
    const totals: IMicronutrients = {
      fiber: 25, calcium: 1000, iron: 18, sodium: 2300,
      potassium: 2600, magnesium: 320, vitaminA: 700, vitaminC: 75,
    }

    const result = calculateRdaPercentages(totals, 'FEMALE')

    // All at 100% RDA for FEMALE
    expect(result.fiber).toBe(100)
    expect(result.calcium).toBe(100)
    expect(result.iron).toBe(100)
    expect(result.sodium).toBe(100)
    expect(result.potassium).toBe(100)
    expect(result.magnesium).toBe(100)
    expect(result.vitaminA).toBe(100)
    expect(result.vitaminC).toBe(100)
  })

  it('should return 0 for zero totals', () => {
    const result = calculateRdaPercentages(ZERO_MICROS, 'MALE')

    for (const key of MICRO_KEYS) {
      expect(result[key]).toBe(0)
    }
  })

  it('should allow values above 100%', () => {
    const totals: IMicronutrients = {
      fiber: 50, calcium: 1500, iron: 20, sodium: 3500,
      potassium: 5000, magnesium: 600, vitaminA: 1200, vitaminC: 200,
    }

    const result = calculateRdaPercentages(totals, 'MALE')

    expect(result.fiber).toBe(132)      // 50/38
    expect(result.calcium).toBe(150)    // 1500/1000
    expect(result.sodium).toBe(152)     // 3500/2300
    expect(result.vitaminC).toBe(222)   // 200/90
  })
})

// ====================================================
// getMicroAlerts
// ====================================================

describe('getMicroAlerts', () => {
  it('should return empty for all micros at 70%+', () => {
    const pcts = {
      fiber: 80, calcium: 90, iron: 75, sodium: 70,
      potassium: 80, magnesium: 70, vitaminA: 85, vitaminC: 100,
    } as Record<string, number>

    const alerts = getMicroAlerts(pcts as any)

    expect(alerts).toEqual([])
  })

  it('should alert for micros below 70%', () => {
    const pcts = {
      fiber: 50, calcium: 60, iron: 100, sodium: 80,
      potassium: 90, magnesium: 69, vitaminA: 80, vitaminC: 30,
    } as Record<string, number>

    const alerts = getMicroAlerts(pcts as any)

    expect(alerts).toHaveLength(4)
    expect(alerts).toContainEqual({ key: 'fiber', percent: 50, type: 'low' })
    expect(alerts).toContainEqual({ key: 'calcium', percent: 60, type: 'low' })
    expect(alerts).toContainEqual({ key: 'magnesium', percent: 69, type: 'low' })
    expect(alerts).toContainEqual({ key: 'vitaminC', percent: 30, type: 'low' })
  })

  it('should alert for sodium ABOVE 100% (high)', () => {
    const pcts = {
      fiber: 80, calcium: 80, iron: 80, sodium: 130,
      potassium: 80, magnesium: 80, vitaminA: 80, vitaminC: 80,
    } as Record<string, number>

    const alerts = getMicroAlerts(pcts as any)

    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toEqual({ key: 'sodium', percent: 130, type: 'high' })
  })

  it('should NOT alert for sodium at exactly 100%', () => {
    const pcts = {
      fiber: 80, calcium: 80, iron: 80, sodium: 100,
      potassium: 80, magnesium: 80, vitaminA: 80, vitaminC: 80,
    } as Record<string, number>

    const alerts = getMicroAlerts(pcts as any)

    expect(alerts).toEqual([])
  })

  it('should NOT alert for sodium below 70% (sodium is different)', () => {
    // Sódio baixo NÃO é alerta — menos sódio é bom
    const pcts = {
      fiber: 80, calcium: 80, iron: 80, sodium: 40,
      potassium: 80, magnesium: 80, vitaminA: 80, vitaminC: 80,
    } as Record<string, number>

    const alerts = getMicroAlerts(pcts as any)

    expect(alerts).toEqual([])
  })

  it('should handle mixed alerts (low + high sodium)', () => {
    const pcts = {
      fiber: 30, calcium: 50, iron: 90, sodium: 150,
      potassium: 60, magnesium: 80, vitaminA: 40, vitaminC: 10,
    } as Record<string, number>

    const alerts = getMicroAlerts(pcts as any)

    // fiber 30 (low), calcium 50 (low), sodium 150 (high),
    // potassium 60 (low), vitaminA 40 (low), vitaminC 10 (low)
    expect(alerts).toHaveLength(6)
    expect(alerts.filter(a => a.type === 'low')).toHaveLength(5)
    expect(alerts.filter(a => a.type === 'high')).toHaveLength(1)
  })
})

// ====================================================
// Constants
// ====================================================

describe('constants', () => {
  it('MICRO_KEYS should have 8 entries', () => {
    expect(MICRO_KEYS).toHaveLength(8)
  })

  it('ZERO_MICROS should have all keys at 0', () => {
    for (const key of MICRO_KEYS) {
      expect(ZERO_MICROS[key]).toBe(0)
    }
  })

  it('RDA should have both genders with all micro keys', () => {
    for (const gender of ['MALE', 'FEMALE'] as const) {
      for (const key of MICRO_KEYS) {
        expect(RDA[gender][key]).toBeGreaterThan(0)
      }
    }
  })

  it('MICRO_META should have label and unit for each key', () => {
    for (const key of MICRO_KEYS) {
      expect(MICRO_META[key].label).toBeTruthy()
      expect(MICRO_META[key].unit).toBeTruthy()
    }
  })

  it('FEMALE iron RDA should be higher than MALE (menstruation)', () => {
    expect(RDA.FEMALE.iron).toBeGreaterThan(RDA.MALE.iron)
  })
})
