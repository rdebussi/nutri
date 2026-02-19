// ====================================================
// MICRONUTRIENTES — Tipos, constantes e helpers
// ====================================================
// 25 micronutrientes rastreados, baseados em TACO + USDA
// e nas recomendações RDA/AI/UL (NIH DRI).
//
// IMicronutrients é usado em:
// - IFood (dieta): valores absolutos para a porção
// - FoodItem/UserFood: valores per-100g (campos flat)
// - IDiet: totalMicronutrients (soma de todos os foods)
//
// Os micros são INFORMACIONAIS — não participam do
// pipeline de adaptação (recálculo de refeições pendentes).

export interface IMicronutrients {
  // === Outros ===
  fiber: number            // g   — fibra alimentar
  omega3: number           // g   — ômega-3 (EPA + DHA + ALA)
  cholesterol: number      // mg  — colesterol (limite, não meta!)

  // === Vitaminas ===
  vitaminA: number         // mcg — vitamina A (RAE)
  vitaminB1: number        // mg  — tiamina
  vitaminB2: number        // mg  — riboflavina
  vitaminB3: number        // mg  — niacina
  vitaminB5: number        // mg  — ácido pantotênico
  vitaminB6: number        // mg  — piridoxina
  vitaminB9: number        // mcg — folato
  vitaminB12: number       // mcg — cobalamina
  vitaminC: number         // mg  — ácido ascórbico
  vitaminD: number         // mcg — colecalciferol
  vitaminE: number         // mg  — alfa-tocoferol
  vitaminK: number         // mcg — filoquinona

  // === Minerais ===
  calcium: number          // mg  — cálcio
  iron: number             // mg  — ferro
  magnesium: number        // mg  — magnésio
  phosphorus: number       // mg  — fósforo
  potassium: number        // mg  — potássio
  sodium: number           // mg  — sódio (limite, não meta!)
  zinc: number             // mg  — zinco
  copper: number           // mg  — cobre
  manganese: number        // mg  — manganês
  selenium: number         // mcg — selênio
}

export const ZERO_MICROS: IMicronutrients = {
  fiber: 0, omega3: 0, cholesterol: 0,
  vitaminA: 0, vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0,
  vitaminB6: 0, vitaminB9: 0, vitaminB12: 0, vitaminC: 0,
  vitaminD: 0, vitaminE: 0, vitaminK: 0,
  calcium: 0, iron: 0, magnesium: 0, phosphorus: 0,
  potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0, selenium: 0,
}

export const MICRO_KEYS = [
  // Outros
  'fiber', 'omega3', 'cholesterol',
  // Vitaminas
  'vitaminA', 'vitaminB1', 'vitaminB2', 'vitaminB3', 'vitaminB5',
  'vitaminB6', 'vitaminB9', 'vitaminB12', 'vitaminC',
  'vitaminD', 'vitaminE', 'vitaminK',
  // Minerais
  'calcium', 'iron', 'magnesium', 'phosphorus',
  'potassium', 'sodium', 'zinc', 'copper', 'manganese', 'selenium',
] as const

export type MicroKey = typeof MICRO_KEYS[number]

// ====================================================
// RDA — Recommended Daily Allowance por gênero
// ====================================================
// Fonte: NIH Dietary Reference Intakes (adultos 19-50 anos)
// Sódio e colesterol usam UL (Upper Limit), não RDA.

export type Gender = 'MALE' | 'FEMALE'

export const RDA: Record<Gender, IMicronutrients> = {
  MALE: {
    fiber: 38,           // g   (AI)
    omega3: 1.6,         // g   (AI)
    cholesterol: 300,    // mg  (UL — limite superior)
    vitaminA: 900,       // mcg (RDA)
    vitaminB1: 1.2,      // mg  (RDA)
    vitaminB2: 1.3,      // mg  (RDA)
    vitaminB3: 16,       // mg  (RDA)
    vitaminB5: 5,        // mg  (AI)
    vitaminB6: 1.3,      // mg  (RDA)
    vitaminB9: 400,      // mcg (RDA)
    vitaminB12: 2.4,     // mcg (RDA)
    vitaminC: 90,        // mg  (RDA)
    vitaminD: 15,        // mcg (RDA)
    vitaminE: 15,        // mg  (RDA)
    vitaminK: 120,       // mcg (AI)
    calcium: 1000,       // mg  (RDA)
    iron: 8,             // mg  (RDA)
    magnesium: 420,      // mg  (RDA)
    phosphorus: 700,     // mg  (RDA)
    potassium: 3400,     // mg  (AI)
    sodium: 2300,        // mg  (UL — limite superior)
    zinc: 11,            // mg  (RDA)
    copper: 0.9,         // mg  (RDA)
    manganese: 2.3,      // mg  (AI)
    selenium: 55,        // mcg (RDA)
  },
  FEMALE: {
    fiber: 25,           // g   (AI)
    omega3: 1.1,         // g   (AI)
    cholesterol: 300,    // mg  (UL)
    vitaminA: 700,       // mcg (RDA)
    vitaminB1: 1.1,      // mg  (RDA)
    vitaminB2: 1.1,      // mg  (RDA)
    vitaminB3: 14,       // mg  (RDA)
    vitaminB5: 5,        // mg  (AI)
    vitaminB6: 1.3,      // mg  (RDA)
    vitaminB9: 400,      // mcg (RDA)
    vitaminB12: 2.4,     // mcg (RDA)
    vitaminC: 75,        // mg  (RDA)
    vitaminD: 15,        // mcg (RDA)
    vitaminE: 15,        // mg  (RDA)
    vitaminK: 90,        // mcg (AI)
    calcium: 1000,       // mg  (RDA)
    iron: 18,            // mg  (RDA — maior por menstruação)
    magnesium: 320,      // mg  (RDA)
    phosphorus: 700,     // mg  (RDA)
    potassium: 2600,     // mg  (AI)
    sodium: 2300,        // mg  (UL)
    zinc: 8,             // mg  (RDA)
    copper: 0.9,         // mg  (RDA)
    manganese: 1.8,      // mg  (AI)
    selenium: 55,        // mcg (RDA)
  },
}

// ====================================================
// METADATA — labels, unidades e grupo para UI
// ====================================================

export type MicroGroup = 'other' | 'vitamins' | 'minerals'

export const MICRO_META: Record<MicroKey, { label: string; unit: string; group: MicroGroup }> = {
  // Outros
  fiber:       { label: 'Fibra',        unit: 'g',   group: 'other' },
  omega3:      { label: 'Ômega-3',      unit: 'g',   group: 'other' },
  cholesterol: { label: 'Colesterol',   unit: 'mg',  group: 'other' },
  // Vitaminas
  vitaminA:    { label: 'Vitamina A',   unit: 'mcg', group: 'vitamins' },
  vitaminB1:   { label: 'Vitamina B1',  unit: 'mg',  group: 'vitamins' },
  vitaminB2:   { label: 'Vitamina B2',  unit: 'mg',  group: 'vitamins' },
  vitaminB3:   { label: 'Vitamina B3',  unit: 'mg',  group: 'vitamins' },
  vitaminB5:   { label: 'Vitamina B5',  unit: 'mg',  group: 'vitamins' },
  vitaminB6:   { label: 'Vitamina B6',  unit: 'mg',  group: 'vitamins' },
  vitaminB9:   { label: 'Folato (B9)',  unit: 'mcg', group: 'vitamins' },
  vitaminB12:  { label: 'Vitamina B12', unit: 'mcg', group: 'vitamins' },
  vitaminC:    { label: 'Vitamina C',   unit: 'mg',  group: 'vitamins' },
  vitaminD:    { label: 'Vitamina D',   unit: 'mcg', group: 'vitamins' },
  vitaminE:    { label: 'Vitamina E',   unit: 'mg',  group: 'vitamins' },
  vitaminK:    { label: 'Vitamina K',   unit: 'mcg', group: 'vitamins' },
  // Minerais
  calcium:     { label: 'Cálcio',       unit: 'mg',  group: 'minerals' },
  iron:        { label: 'Ferro',        unit: 'mg',  group: 'minerals' },
  magnesium:   { label: 'Magnésio',     unit: 'mg',  group: 'minerals' },
  phosphorus:  { label: 'Fósforo',      unit: 'mg',  group: 'minerals' },
  potassium:   { label: 'Potássio',     unit: 'mg',  group: 'minerals' },
  sodium:      { label: 'Sódio',        unit: 'mg',  group: 'minerals' },
  zinc:        { label: 'Zinco',        unit: 'mg',  group: 'minerals' },
  copper:      { label: 'Cobre',        unit: 'mg',  group: 'minerals' },
  manganese:   { label: 'Manganês',     unit: 'mg',  group: 'minerals' },
  selenium:    { label: 'Selênio',      unit: 'mcg', group: 'minerals' },
}

// Nutrientes que alertam quando ALTOS (são limites, não metas)
export const HIGH_ALERT_KEYS: readonly MicroKey[] = ['sodium', 'cholesterol'] as const

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
 * - Sódio e colesterol: alerta quando ACIMA de 100% (são limites)
 */
export function getMicroAlerts(
  percentages: Record<MicroKey, number>,
): Array<{ key: MicroKey; percent: number; type: 'low' | 'high' }> {
  const alerts: Array<{ key: MicroKey; percent: number; type: 'low' | 'high' }> = []

  for (const key of MICRO_KEYS) {
    const pct = percentages[key]
    if ((HIGH_ALERT_KEYS as readonly string[]).includes(key)) {
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
