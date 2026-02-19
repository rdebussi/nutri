import mongoose, { Schema, Document } from 'mongoose'

// ====================================================
// FOOD FAVORITE MODEL (MongoDB)
// ====================================================
// Registro de alimentos favoritos do usuário.
// Funciona como um "bookmark" — o alimento pode vir da
// base TACO (FoodItem) ou dos alimentos customizados (UserFood).

export interface IFoodFavorite extends Document {
  userId: string
  foodId: string
  foodSource: 'database' | 'custom'
  createdAt: Date
}

const foodFavoriteSchema = new Schema<IFoodFavorite>({
  userId: { type: String, required: true },
  foodId: { type: String, required: true },
  foodSource: {
    type: String,
    required: true,
    enum: ['database', 'custom'],
  },
}, { timestamps: { createdAt: true, updatedAt: false } })

// Um usuário não pode favoritar o mesmo alimento duas vezes
foodFavoriteSchema.index({ userId: 1, foodId: 1 }, { unique: true })

export const FoodFavorite = mongoose.model<IFoodFavorite>('FoodFavorite', foodFavoriteSchema)
