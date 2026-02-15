import mongoose, { Schema, Document } from 'mongoose'

// ====================================================
// EXERCISE MODEL (MongoDB)
// ====================================================
// Base de exercícios com valores MET (Metabolic Equivalent of Task).
//
// MET = quanto de energia um exercício gasta em relação ao repouso.
// MET 1.0 = em repouso (sentado quieto)
// MET 3.0 = caminhada leve (3x mais que repouso)
// MET 8.0 = corrida moderada (8x mais que repouso)
//
// Cálculo de calorias: MET × peso(kg) × duração(horas)
// Ex: Corrida (MET 8) × 70kg × 1h = 560 kcal

export interface IExercise extends Document {
  name: string
  category: 'strength' | 'cardio' | 'sports' | 'flexibility' | 'daily'
  met: number
}

const exerciseSchema = new Schema<IExercise>({
  name: { type: String, required: true, unique: true },
  category: {
    type: String,
    required: true,
    enum: ['strength', 'cardio', 'sports', 'flexibility', 'daily'],
  },
  met: { type: Number, required: true, min: 1 },
})

// Índice textual para busca por nome
exerciseSchema.index({ name: 'text' })

export const Exercise = mongoose.model<IExercise>('Exercise', exerciseSchema)
