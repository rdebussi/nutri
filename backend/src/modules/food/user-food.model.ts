import mongoose, { Schema, Document } from 'mongoose'
import { FOOD_CATEGORIES, type FoodCategory } from './food.model.js'

// ====================================================
// USER FOOD MODEL (MongoDB)
// ====================================================
// Alimentos customizados criados pelo usuário.
// Ex: "Panqueca de aveia", "Shake de proteína caseiro"
//
// Diferença entre FoodItem e UserFood:
// - FoodItem  = base TACO (alimentos genéricos, públicos)
// - UserFood  = criados pelo usuário (receitas pessoais, privados)
//
// Ambos usam valores por 100g como referência.
// Se o usuário informar macros por porção (ex: "1 panqueca = 80g"),
// o service converte para per-100g antes de salvar.

export interface IUserFood extends Document {
  userId: string
  name: string
  category: FoodCategory
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  // Micronutrientes per 100g (opcionais)
  fiberPer100g?: number      // g
  calciumPer100g?: number    // mg
  ironPer100g?: number       // mg
  sodiumPer100g?: number     // mg
  potassiumPer100g?: number  // mg
  magnesiumPer100g?: number  // mg
  vitaminAPer100g?: number   // mcg RAE
  vitaminCPer100g?: number   // mg
  servingSize?: number    // gramas por porção (ex: 80g = 1 panqueca)
  servingName?: string    // "1 panqueca", "1 fatia"
  ingredients?: string    // descrição opcional dos ingredientes
  createdAt: Date
  updatedAt: Date
}

const userFoodSchema = new Schema<IUserFood>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: FOOD_CATEGORIES,
  },
  caloriesPer100g: { type: Number, required: true, min: 0 },
  proteinPer100g: { type: Number, required: true, min: 0 },
  carbsPer100g: { type: Number, required: true, min: 0 },
  fatPer100g: { type: Number, required: true, min: 0 },
  // Micronutrientes per 100g (opcionais — default 0)
  fiberPer100g: { type: Number, default: 0, min: 0 },
  calciumPer100g: { type: Number, default: 0, min: 0 },
  ironPer100g: { type: Number, default: 0, min: 0 },
  sodiumPer100g: { type: Number, default: 0, min: 0 },
  potassiumPer100g: { type: Number, default: 0, min: 0 },
  magnesiumPer100g: { type: Number, default: 0, min: 0 },
  vitaminAPer100g: { type: Number, default: 0, min: 0 },
  vitaminCPer100g: { type: Number, default: 0, min: 0 },
  servingSize: { type: Number, min: 1 },
  servingName: { type: String },
  ingredients: { type: String, maxlength: 500 },
}, { timestamps: true })

// Um usuário não pode ter dois alimentos com o mesmo nome
userFoodSchema.index({ userId: 1, name: 1 }, { unique: true })

// Busca por nome
userFoodSchema.index({ name: 'text' })

export const UserFood = mongoose.model<IUserFood>('UserFood', userFoodSchema)
