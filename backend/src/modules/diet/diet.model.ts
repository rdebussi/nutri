import mongoose, { Schema, Document } from 'mongoose'

// ====================================================
// MODEL DE DIETA (MongoDB / Mongoose)
// ====================================================
// No Mongoose, primeiro definimos uma INTERFACE TypeScript
// para ter tipagem, depois criamos um SCHEMA Mongoose
// que valida os dados na hora de salvar no banco.
//
// Diferença fundamental:
// - Prisma (PostgreSQL): schema define TABELAS com colunas fixas
// - Mongoose (MongoDB): schema define DOCUMENTOS (JSONs) com estrutura flexível
//
// Um documento MongoDB é basicamente um JSON salvo no banco.
// Não tem "linhas" e "colunas" — tem campos aninhados, arrays, subdocuments.

// Interface TypeScript — define o TIPO para o compilador
export interface IFood {
  name: string
  quantity: string
  calories: number
  protein: number   // em gramas
  carbs: number     // em gramas
  fat: number       // em gramas
}

export interface IMeal {
  name: string        // "Café da manhã", "Almoço", etc.
  time: string        // "07:00", "12:00"
  foods: IFood[]
  totalCalories: number
}

export interface IDiet extends Document {
  userId: string
  title: string
  meals: IMeal[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  goal: string
  notes: string
  createdAt: Date
}

// Schema Mongoose — define a ESTRUTURA para o banco
// Cada campo tem um tipo e regras de validação.
const foodSchema = new Schema<IFood>({
  name: { type: String, required: true },
  quantity: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
}, { _id: false }) // _id: false → não gera ID para subdocuments (não precisamos)

const mealSchema = new Schema<IMeal>({
  name: { type: String, required: true },
  time: { type: String, required: true },
  foods: [foodSchema],         // Array de subdocuments!
  totalCalories: { type: Number, required: true },
}, { _id: false })

const dietSchema = new Schema<IDiet>({
  userId: { type: String, required: true, index: true },
  // index: true → cria um índice nesse campo.
  // Sem índice: MongoDB varre TODOS os documentos para achar as dietas do user (lento).
  // Com índice: MongoDB vai direto nos documentos certos (rápido).
  // Pense como o índice de um livro: em vez de ler página por página,
  // você vai direto na página que quer.
  title: { type: String, required: true },
  meals: [mealSchema],
  totalCalories: { type: Number, required: true },
  totalProtein: { type: Number, required: true },
  totalCarbs: { type: Number, required: true },
  totalFat: { type: Number, required: true },
  goal: { type: String, required: true },
  notes: { type: String, default: '' },
}, {
  timestamps: true, // cria createdAt e updatedAt automaticamente
})

// mongoose.model() registra o model globalmente.
// Depois é só fazer: Diet.find(), Diet.create(), etc.
export const Diet = mongoose.model<IDiet>('Diet', dietSchema)
