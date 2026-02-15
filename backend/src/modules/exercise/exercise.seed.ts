import { Exercise } from './exercise.model.js'

// ====================================================
// SEED DE EXERCÍCIOS
// ====================================================
// Base inicial com exercícios comuns e seus valores MET.
// Fontes: Compendium of Physical Activities (Ainsworth et al.)
//
// Categorias:
// - strength: musculação, calistenia
// - cardio: corrida, ciclismo, natação
// - sports: futebol, basquete, lutas
// - flexibility: yoga, pilates, alongamento
// - daily: caminhada, tarefas domésticas
//
// Cada exercício tem um MET "médio" para intensidade moderada.
// O ajuste por intensidade é feito multiplicando:
// - LIGHT: MET × 0.75
// - MODERATE: MET × 1.0
// - INTENSE: MET × 1.25

const exercises = [
  // === STRENGTH (Musculação & Força) ===
  { name: 'Musculação', category: 'strength', met: 6.0 },
  { name: 'Calistenia', category: 'strength', met: 5.0 },
  { name: 'CrossFit', category: 'strength', met: 8.0 },
  { name: 'Kettlebell', category: 'strength', met: 6.0 },
  { name: 'Treino funcional', category: 'strength', met: 5.5 },

  // === CARDIO ===
  { name: 'Corrida', category: 'cardio', met: 8.0 },
  { name: 'Caminhada rápida', category: 'cardio', met: 4.3 },
  { name: 'Ciclismo', category: 'cardio', met: 7.5 },
  { name: 'Natação', category: 'cardio', met: 7.0 },
  { name: 'HIIT', category: 'cardio', met: 10.0 },
  { name: 'Pular corda', category: 'cardio', met: 11.0 },
  { name: 'Elíptico', category: 'cardio', met: 5.0 },
  { name: 'Esteira', category: 'cardio', met: 7.0 },
  { name: 'Spinning', category: 'cardio', met: 8.5 },
  { name: 'Remo (ergômetro)', category: 'cardio', met: 7.0 },
  { name: 'Escada', category: 'cardio', met: 9.0 },

  // === SPORTS (Esportes) ===
  { name: 'Futebol', category: 'sports', met: 7.0 },
  { name: 'Basquete', category: 'sports', met: 6.5 },
  { name: 'Vôlei', category: 'sports', met: 4.0 },
  { name: 'Tênis', category: 'sports', met: 7.3 },
  { name: 'Jiu-Jitsu', category: 'sports', met: 7.5 },
  { name: 'Muay Thai', category: 'sports', met: 8.0 },
  { name: 'Boxe', category: 'sports', met: 7.8 },
  { name: 'Dança', category: 'sports', met: 5.5 },

  // === FLEXIBILITY (Flexibilidade) ===
  { name: 'Yoga', category: 'flexibility', met: 3.0 },
  { name: 'Pilates', category: 'flexibility', met: 3.5 },
  { name: 'Alongamento', category: 'flexibility', met: 2.5 },

  // === DAILY (Atividades do dia a dia) ===
  { name: 'Caminhada leve', category: 'daily', met: 3.0 },
  { name: 'Subir escadas', category: 'daily', met: 4.0 },
  { name: 'Tarefas domésticas', category: 'daily', met: 3.3 },
] as const

// Seed idempotente — usa upsert para não duplicar exercícios
export async function seedExercises(): Promise<number> {
  let count = 0

  for (const exercise of exercises) {
    await Exercise.updateOne(
      { name: exercise.name },
      { $setOnInsert: exercise },
      { upsert: true },
    )
    count++
  }

  return count
}
