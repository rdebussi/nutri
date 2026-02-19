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
  fiberPer100g?: number         // g
  omega3Per100g?: number        // g
  cholesterolPer100g?: number   // mg
  vitaminAPer100g?: number      // mcg RAE
  vitaminB1Per100g?: number     // mg
  vitaminB2Per100g?: number     // mg
  vitaminB3Per100g?: number     // mg
  vitaminB5Per100g?: number     // mg
  vitaminB6Per100g?: number     // mg
  vitaminB9Per100g?: number     // mcg
  vitaminB12Per100g?: number    // mcg
  vitaminCPer100g?: number      // mg
  vitaminDPer100g?: number      // mcg
  vitaminEPer100g?: number      // mg
  vitaminKPer100g?: number      // mcg
  calciumPer100g?: number       // mg
  ironPer100g?: number          // mg
  magnesiumPer100g?: number     // mg
  phosphorusPer100g?: number    // mg
  potassiumPer100g?: number     // mg
  sodiumPer100g?: number        // mg
  zincPer100g?: number          // mg
  copperPer100g?: number        // mg
  manganesePer100g?: number     // mg
  seleniumPer100g?: number      // mcg
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
  omega3Per100g: { type: Number, default: 0, min: 0 },
  cholesterolPer100g: { type: Number, default: 0, min: 0 },
  vitaminAPer100g: { type: Number, default: 0, min: 0 },
  vitaminB1Per100g: { type: Number, default: 0, min: 0 },
  vitaminB2Per100g: { type: Number, default: 0, min: 0 },
  vitaminB3Per100g: { type: Number, default: 0, min: 0 },
  vitaminB5Per100g: { type: Number, default: 0, min: 0 },
  vitaminB6Per100g: { type: Number, default: 0, min: 0 },
  vitaminB9Per100g: { type: Number, default: 0, min: 0 },
  vitaminB12Per100g: { type: Number, default: 0, min: 0 },
  vitaminCPer100g: { type: Number, default: 0, min: 0 },
  vitaminDPer100g: { type: Number, default: 0, min: 0 },
  vitaminEPer100g: { type: Number, default: 0, min: 0 },
  vitaminKPer100g: { type: Number, default: 0, min: 0 },
  calciumPer100g: { type: Number, default: 0, min: 0 },
  ironPer100g: { type: Number, default: 0, min: 0 },
  magnesiumPer100g: { type: Number, default: 0, min: 0 },
  phosphorusPer100g: { type: Number, default: 0, min: 0 },
  potassiumPer100g: { type: Number, default: 0, min: 0 },
  sodiumPer100g: { type: Number, default: 0, min: 0 },
  zincPer100g: { type: Number, default: 0, min: 0 },
  copperPer100g: { type: Number, default: 0, min: 0 },
  manganesePer100g: { type: Number, default: 0, min: 0 },
  seleniumPer100g: { type: Number, default: 0, min: 0 },
  servingSize: { type: Number, min: 1 },
  servingName: { type: String },
  ingredients: { type: String, maxlength: 500 },
}, { timestamps: true })

// Um usuário não pode ter dois alimentos com o mesmo nome
userFoodSchema.index({ userId: 1, name: 1 }, { unique: true })

// Busca por nome
userFoodSchema.index({ name: 'text' })

export const UserFood = mongoose.model<IUserFood>('UserFood', userFoodSchema)
