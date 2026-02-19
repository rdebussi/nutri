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
  // Micronutrientes per 100g (TACO + USDA)
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
  commonPortions: [commonPortionSchema],
})

// Índice textual para busca rápida por nome
foodItemSchema.index({ name: 'text' })

export const FoodItem = mongoose.model<IFoodItem>('FoodItem', foodItemSchema)
