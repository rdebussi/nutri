import mongoose, { Schema, Document } from 'mongoose'

// ====================================================
// CHECK-IN MODEL (MongoDB)
// ====================================================
// Um check-in = registro de um dia do usuário seguindo a dieta.
// O usuário marca quais refeições comeu/não comeu.
//
// Estrutura:
//   CheckIn (documento principal)
//     -> meals[] (subdocumentos — cada refeição do dia)
//
// Índice composto {userId, date} garante:
//   1. Performance em buscas por usuário + data
//   2. Unicidade — apenas um check-in por dia por usuário

export type MealStatus = 'pending' | 'completed' | 'skipped'

export interface IMealCheckIn {
  mealName: string
  status: MealStatus
  completedAt?: Date
  skippedAt?: Date
  notes?: string
}

export interface IExerciseLog {
  exerciseName: string
  category: string
  durationMinutes: number
  caloriesBurned: number
  isExtra: boolean  // true = exercício avulso (fora da rotina)
}

// Food override: troca de alimento no check-in (por dia).
// Não altera a dieta base — fica salvo apenas no check-in.
export interface IFoodOverride {
  mealIndex: number
  foodIndex: number
  originalFood: {
    name: string
    quantity: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  newFood: {
    name: string
    quantity: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export interface ICheckIn extends Document {
  userId: string
  dietId: string
  date: Date
  meals: IMealCheckIn[]
  exercises: IExerciseLog[]
  foodOverrides: IFoodOverride[]
  adherenceRate: number
  totalCaloriesBurned: number
  createdAt: Date
  updatedAt: Date
}

const mealCheckInSchema = new Schema<IMealCheckIn>({
  mealName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
  completedAt: { type: Date },
  skippedAt: { type: Date },
  notes: { type: String, maxlength: 500 },
}, { _id: false })

const exerciseLogSchema = new Schema<IExerciseLog>({
  exerciseName: { type: String, required: true },
  category: { type: String, required: true },
  durationMinutes: { type: Number, required: true, min: 1 },
  caloriesBurned: { type: Number, required: true, min: 0 },
  isExtra: { type: Boolean, required: true, default: false },
}, { _id: false })

const foodInOverrideSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
}, { _id: false })

const foodOverrideSchema = new Schema<IFoodOverride>({
  mealIndex: { type: Number, required: true },
  foodIndex: { type: Number, required: true },
  originalFood: { type: foodInOverrideSchema, required: true },
  newFood: { type: foodInOverrideSchema, required: true },
}, { _id: false })

const checkInSchema = new Schema<ICheckIn>({
  userId: { type: String, required: true, index: true },
  dietId: { type: String, required: true },
  date: { type: Date, required: true },
  meals: { type: [mealCheckInSchema], required: true },
  exercises: { type: [exerciseLogSchema], default: [] },
  foodOverrides: { type: [foodOverrideSchema], default: [] },
  adherenceRate: { type: Number, required: true, min: 0, max: 100 },
  totalCaloriesBurned: { type: Number, default: 0 },
}, { timestamps: true })

// Índice composto: garante um check-in por dia por usuário
// e acelera queries por userId + date (a busca mais comum)
checkInSchema.index({ userId: 1, date: 1 }, { unique: true })

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', checkInSchema)
