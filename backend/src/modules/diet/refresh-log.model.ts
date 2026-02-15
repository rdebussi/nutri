import mongoose, { Schema, Document } from 'mongoose'

// ====================================================
// REFRESH LOG — Controle de limite de refreshes
// ====================================================
// Conta quantos refreshes de refeição o usuário fez por dia.
// Limites: FREE = 2/dia, PRO = 10/dia, ADMIN = ilimitado.
//
// Usa MongoDB ao invés de Redis por simplicidade.
// Quando Redis for integrado, podemos migrar para INCR + EXPIREAT.

export interface IRefreshLog extends Document {
  userId: string
  date: Date
  count: number
}

const refreshLogSchema = new Schema<IRefreshLog>({
  userId: { type: String, required: true },
  date: { type: Date, required: true },
  count: { type: Number, default: 0 },
})

// Índice composto único: um registro por usuário por dia
refreshLogSchema.index({ userId: 1, date: 1 }, { unique: true })

export const RefreshLog = mongoose.model<IRefreshLog>('RefreshLog', refreshLogSchema)
