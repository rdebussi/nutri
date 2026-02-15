import { describe, it, expect } from 'vitest'
import {
  calculateBMR,
  calculateExerciseCalories,
  calculateDailyTDEE,
  calculateWeeklyAvgTDEE,
  adjustForGoal,
} from '../tdee.js'

// ====================================================
// TESTES DO TDEE CALCULATOR
// ====================================================
// Fórmula Mifflin-St Jeor (padrão ouro para TMB):
//   Homem:  10 × peso + 6.25 × altura - 5 × idade + 5
//   Mulher: 10 × peso + 6.25 × altura - 5 × idade - 161
//
// Exercício: MET × peso(kg) × duração(horas)
// TDEE = TMB + gasto com exercícios do dia

describe('TDEE Calculator', () => {

  // ====================================================
  // calculateBMR (Taxa Metabólica Basal)
  // ====================================================

  describe('calculateBMR', () => {
    it('should calculate BMR for a male', () => {
      // Homem, 80kg, 175cm, 30 anos
      // 10×80 + 6.25×175 - 5×30 + 5 = 800 + 1093.75 - 150 + 5 = 1748.75
      const bmr = calculateBMR({ weight: 80, height: 175, age: 30, gender: 'MALE' })
      expect(bmr).toBeCloseTo(1748.75, 0)
    })

    it('should calculate BMR for a female', () => {
      // Mulher, 60kg, 165cm, 25 anos
      // 10×60 + 6.25×165 - 5×25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      const bmr = calculateBMR({ weight: 60, height: 165, age: 25, gender: 'FEMALE' })
      expect(bmr).toBeCloseTo(1345.25, 0)
    })

    it('should default to female formula for OTHER gender', () => {
      const bmr = calculateBMR({ weight: 70, height: 170, age: 30, gender: 'OTHER' })
      // 10×70 + 6.25×170 - 5×30 - 161 = 700 + 1062.5 - 150 - 161 = 1451.5
      expect(bmr).toBeCloseTo(1451.5, 0)
    })
  })

  // ====================================================
  // calculateExerciseCalories
  // ====================================================

  describe('calculateExerciseCalories', () => {
    it('should calculate calories burned', () => {
      // MET 8.0 (corrida), 70kg, 60min
      // 8.0 × 70 × 1.0 = 560 kcal
      const calories = calculateExerciseCalories({ met: 8.0, weightKg: 70, durationMinutes: 60 })
      expect(calories).toBeCloseTo(560, 0)
    })

    it('should adjust for intensity LIGHT (×0.75)', () => {
      // MET 6.0 × 0.75 = 4.5, 80kg, 60min
      // 4.5 × 80 × 1.0 = 360 kcal
      const calories = calculateExerciseCalories({
        met: 6.0, weightKg: 80, durationMinutes: 60, intensity: 'LIGHT',
      })
      expect(calories).toBeCloseTo(360, 0)
    })

    it('should adjust for intensity INTENSE (×1.25)', () => {
      // MET 6.0 × 1.25 = 7.5, 80kg, 60min
      // 7.5 × 80 × 1.0 = 600 kcal
      const calories = calculateExerciseCalories({
        met: 6.0, weightKg: 80, durationMinutes: 60, intensity: 'INTENSE',
      })
      expect(calories).toBeCloseTo(600, 0)
    })

    it('should handle 30min duration correctly', () => {
      // MET 8.0, 70kg, 30min (0.5h)
      // 8.0 × 70 × 0.5 = 280 kcal
      const calories = calculateExerciseCalories({ met: 8.0, weightKg: 70, durationMinutes: 30 })
      expect(calories).toBeCloseTo(280, 0)
    })
  })

  // ====================================================
  // calculateDailyTDEE (TMB + exercícios do dia)
  // ====================================================

  describe('calculateDailyTDEE', () => {
    it('should return BMR × 1.2 when no exercises', () => {
      // BMR homem 80kg, 175cm, 30 anos = 1748.75
      // Sem exercício: TMB × 1.2 (fator de atividade basal — respirar, digerir, etc.)
      const tdee = calculateDailyTDEE({
        weight: 80, height: 175, age: 30, gender: 'MALE',
        exercises: [],
      })
      expect(tdee).toBeCloseTo(1748.75 * 1.2, 0)
    })

    it('should add exercise calories to base TDEE', () => {
      // BMR = 1748.75, base = 1748.75 × 1.2 = 2098.5
      // Corrida 60min: 8.0 × 80 × 1.0 = 640
      // Total: 2098.5 + 640 = 2738.5
      const tdee = calculateDailyTDEE({
        weight: 80, height: 175, age: 30, gender: 'MALE',
        exercises: [
          { met: 8.0, durationMinutes: 60 },
        ],
      })
      expect(tdee).toBeCloseTo(2098.5 + 640, 0)
    })

    it('should sum multiple exercises', () => {
      // BMR base = 2098.5
      // Musculação 60min: 6.0 × 80 × 1.0 = 480
      // Corrida 30min: 8.0 × 80 × 0.5 = 320
      // Total: 2098.5 + 480 + 320 = 2898.5
      const tdee = calculateDailyTDEE({
        weight: 80, height: 175, age: 30, gender: 'MALE',
        exercises: [
          { met: 6.0, durationMinutes: 60 },
          { met: 8.0, durationMinutes: 30 },
        ],
      })
      expect(tdee).toBeCloseTo(2098.5 + 480 + 320, 0)
    })
  })

  // ====================================================
  // calculateWeeklyAvgTDEE (média semanal)
  // ====================================================

  describe('calculateWeeklyAvgTDEE', () => {
    it('should average TDEE across the week based on routine', () => {
      // BMR = 1748.75, base diário = 2098.5
      // Musculação 4x/semana, 60min, MET 6.0: 480 kcal/sessão
      // Corrida 2x/semana, 30min, MET 8.0: 320 kcal/sessão
      // Semana: 4×480 + 2×320 = 1920 + 640 = 2560 kcal de exercício
      // Média diária exercício: 2560 / 7 = 365.7
      // TDEE médio: 2098.5 + 365.7 = 2464.2
      const tdee = calculateWeeklyAvgTDEE({
        weight: 80, height: 175, age: 30, gender: 'MALE',
        routines: [
          { met: 6.0, daysPerWeek: 4, durationMinutes: 60 },
          { met: 8.0, daysPerWeek: 2, durationMinutes: 30 },
        ],
      })
      expect(tdee).toBeCloseTo(2098.5 + (2560 / 7), 0)
    })

    it('should return base TDEE when no routines', () => {
      const tdee = calculateWeeklyAvgTDEE({
        weight: 80, height: 175, age: 30, gender: 'MALE',
        routines: [],
      })
      expect(tdee).toBeCloseTo(1748.75 * 1.2, 0)
    })
  })

  // ====================================================
  // adjustForGoal (déficit/superávit calórico)
  // ====================================================

  describe('adjustForGoal', () => {
    it('should apply 20% deficit for LOSE_WEIGHT', () => {
      expect(adjustForGoal(2500, 'LOSE_WEIGHT')).toBe(2000) // 2500 × 0.8
    })

    it('should apply 15% surplus for GAIN_MUSCLE', () => {
      expect(adjustForGoal(2500, 'GAIN_MUSCLE')).toBe(2875) // 2500 × 1.15
    })

    it('should keep maintenance for MAINTAIN', () => {
      expect(adjustForGoal(2500, 'MAINTAIN')).toBe(2500)
    })

    it('should keep maintenance for HEALTH', () => {
      expect(adjustForGoal(2500, 'HEALTH')).toBe(2500)
    })
  })
})
