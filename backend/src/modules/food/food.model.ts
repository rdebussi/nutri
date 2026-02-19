import mongoose, { Schema, Document } from 'mongoose'

// ====================================================
// FOOD ITEM MODEL (MongoDB)
// ====================================================
// Base de dados nutricional com valores por 100g.
// Dados baseados na tabela TACO (Tabela Brasileira de
// Composição de Alimentos) da UNICAMP.
//
// Diferença entre FoodItem e IFood (diet.model.ts):
// - FoodItem = CATÁLOGO de referência (valores por 100g)
// - IFood    = INSTÂNCIA na dieta (valores para a quantidade específica)
//
// Exemplo:
//   Catálogo: Frango grelhado → 165 kcal/100g
//   Dieta:    Frango grelhado 150g → 248 kcal

export const FOOD_CATEGORIES = [
  'grains',      // Cereais e massas: arroz, macarrão, pão, aveia
  'proteins',    // Carnes e ovos: frango, carne, peixe, ovo
  'dairy',       // Laticínios: leite, queijo, iogurte
  'fruits',      // Frutas: banana, maçã, laranja
  'vegetables',  // Verduras e legumes: brócolis, cenoura, tomate
  'legumes',     // Leguminosas: feijão, lentilha, grão-de-bico
  'fats',        // Gorduras e oleaginosas: azeite, castanha, amendoim
  'beverages',   // Bebidas: café, suco, água de coco
  'sweets',      // Doces e açúcares: mel, chocolate
  'others',      // Outros: farinha, granola, temperos
] as const

export type FoodCategory = typeof FOOD_CATEGORIES[number]

export interface ICommonPortion {
  name: string   // "1 xícara", "1 fatia", "1 filé médio"
  grams: number  // equivalente em gramas
}

export interface IFoodItem extends Document {
  name: string
  category: FoodCategory
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  // Micronutrientes per 100g (baseados na tabela TACO)
  fiberPer100g?: number      // g
  calciumPer100g?: number    // mg
  ironPer100g?: number       // mg
  sodiumPer100g?: number     // mg
  potassiumPer100g?: number  // mg
  magnesiumPer100g?: number  // mg
  vitaminAPer100g?: number   // mcg RAE
  vitaminCPer100g?: number   // mg
  commonPortions: ICommonPortion[]
}

const commonPortionSchema = new Schema<ICommonPortion>({
  name: { type: String, required: true },
  grams: { type: Number, required: true, min: 1 },
}, { _id: false })

const foodItemSchema = new Schema<IFoodItem>({
  name: { type: String, required: true, unique: true },
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
  commonPortions: [commonPortionSchema],
})

// Índice textual para busca rápida por nome
foodItemSchema.index({ name: 'text' })

export const FoodItem = mongoose.model<IFoodItem>('FoodItem', foodItemSchema)
