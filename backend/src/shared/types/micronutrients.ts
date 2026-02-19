// ====================================================
// MICRONUTRIENTES — Tipos, constantes e helpers
// ====================================================
// 8 micronutrientes rastreados, baseados na tabela TACO
// e nas recomendações RDA (Recommended Daily Allowance).
//
// IMicronutrients é usado em:
// - IFood (dieta): valores absolutos para a porção
// - FoodItem/UserFood: valores per-100g (campos flat)
// - IDiet: totalMicronutrients (soma de todos os foods)
//
// Os micros são INFORMACIONAIS — não participam do
// pipeline de adaptação (recálculo de refeições pendentes).

export interface IMicronutrients {
  fiber: number      // g   — fibra alimentar
  calcium: number    // mg  — cálcio
  iron: number       // mg  — ferro
  sodium: number     // mg  — sódio (limite, não meta!)
  potassium: number  // mg  — potássio
  magnesium: number  // mg  — magnésio
  vitaminA: number   // mcg — vitamina A (RAE)
  vitaminC: number   // mg  — vitamina C
}

export const ZERO_MICROS: IMicronutrients = {
  fiber: 0, calcium: 0, iron: 0, sodium: 0,
  potassium: 0, magnesium: 0, vitaminA: 0, vitaminC: 0,
}

export const MICRO_KEYS = [
  'fiber', 'calcium', 'iron', 'sodium',
  'potassium', 'magnesium', 'vitaminA', 'vitaminC',
] as const

export type MicroKey = typeof MICRO_KEYS[number]

// ====================================================
// RDA — Recommended Daily Allowance por gênero
// ====================================================
// Fonte: DRI (Dietary Reference Intakes) — IOM/NAM
// Sódio usa UL (Upper Limit), não RDA.

export type Gender = 'MALE' | 'FEMALE'

export const RDA: Record<Gender, IMicronutrients> = {
  MALE: {
    fiber: 38,          // g
    calcium: 1000,      // mg
    iron: 8,            // mg
    sodium: 2300,       // mg (UL — limite superior)
    potassium: 3400,    // mg
    magnesium: 420,     // mg
    vitaminA: 900,      // mcg RAE
    vitaminC: 90,       // mg
  },
  FEMALE: {
    fiber: 25,          // g
    calcium: 1000,      // mg
    iron: 18,           // mg (maior por menstruação)
    sodium: 2300,       // mg (UL)
    potassium: 2600,    // mg
    magnesium: 320,     // mg
    vitaminA: 700,      // mcg RAE
    vitaminC: 75,       // mg
  },
}

// ====================================================
// METADATA — labels e unidades para UI
// ====================================================

export const MICRO_META: Record<MicroKey, { label: string; unit: string }> = {
  fiber:     { label: 'Fibra',      unit: 'g' },
  calcium:   { label: 'Cálcio',     unit: 'mg' },
  iron:      { label: 'Ferro',      unit: 'mg' },
  sodium:    { label: 'Sódio',      unit: 'mg' },
  potassium: { label: 'Potássio',   unit: 'mg' },
  magnesium: { label: 'Magnésio',   unit: 'mg' },
  vitaminA:  { label: 'Vitamina A', unit: 'mcg' },
  vitaminC:  { label: 'Vitamina C', unit: 'mg' },
}

// ====================================================
// HELPERS — funções puras
// ====================================================

/**
 * Soma os micronutrientes de uma lista de items.
 * Aceita objetos parciais (campos ausentes tratados como 0).
 */
export function sumMicronutrients(items: Array<Partial<IMicronutrients> | undefined>): IMicronutrients {
  const result = { ...ZERO_MICROS }
  for (const item of items) {
    if (!item) continue
    for (const key of MICRO_KEYS) {
      result[key] += item[key] ?? 0
    }
  }
  // Arredonda para 1 casa decimal
  for (const key of MICRO_KEYS) {
    result[key] = Math.round(result[key] * 10) / 10
  }
  return result
}

/**
 * Calcula a % da RDA atingida para cada micronutriente.
 * Retorna valores inteiros (ex: 85 = 85% da RDA).
 */
export function calculateRdaPercentages(
  totals: IMicronutrients,
  gender: Gender,
): Record<MicroKey, number> {
  const rda = RDA[gender]
  const result = {} as Record<MicroKey, number>
  for (const key of MICRO_KEYS) {
    result[key] = rda[key] > 0 ? Math.round((totals[key] / rda[key]) * 100) : 0
  }
  return result
}

/**
 * Identifica alertas de micronutrientes.
 * - Maioria: alerta quando ABAIXO de 70% da RDA
 * - Sódio: alerta quando ACIMA de 100% (é limite, não meta)
 */
export function getMicroAlerts(
  percentages: Record<MicroKey, number>,
): Array<{ key: MicroKey; percent: number; type: 'low' | 'high' }> {
  const alerts: Array<{ key: MicroKey; percent: number; type: 'low' | 'high' }> = []

  for (const key of MICRO_KEYS) {
    const pct = percentages[key]
    if (key === 'sodium') {
      if (pct > 100) {
        alerts.push({ key, percent: pct, type: 'high' })
      }
    } else {
      if (pct < 70) {
        alerts.push({ key, percent: pct, type: 'low' })
      }
    }
  }

  return alerts
}
