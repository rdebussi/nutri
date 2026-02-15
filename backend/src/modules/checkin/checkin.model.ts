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

export interface IMealCheckIn {
  mealName: string
  completed: boolean
  completedAt?: Date
  notes?: string
}

export interface ICheckIn extends Document {
  userId: string
  dietId: string
  date: Date
  meals: IMealCheckIn[]
  adherenceRate: number
  createdAt: Date
  updatedAt: Date
}

const mealCheckInSchema = new Schema<IMealCheckIn>({
  mealName: { type: String, required: true },
  completed: { type: Boolean, required: true, default: false },
  completedAt: { type: Date },
  notes: { type: String, maxlength: 500 },
}, { _id: false })

const checkInSchema = new Schema<ICheckIn>({
  userId: { type: String, required: true, index: true },
  dietId: { type: String, required: true },
  date: { type: Date, required: true },
  meals: { type: [mealCheckInSchema], required: true },
  adherenceRate: { type: Number, required: true, min: 0, max: 100 },
}, { timestamps: true })

// Índice composto: garante um check-in por dia por usuário
// e acelera queries por userId + date (a busca mais comum)
checkInSchema.index({ userId: 1, date: 1 }, { unique: true })

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', checkInSchema)
