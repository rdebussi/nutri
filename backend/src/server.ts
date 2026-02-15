import mongoose from 'mongoose'
import { buildApp } from './app.js'
import { env } from './config/env.js'
import { getPrisma } from './shared/database/prisma.js'
import { seedExercises } from './modules/exercise/exercise.seed.js'
import { seedFoods } from './modules/food/food.seed.js'

// ====================================================
// SERVER STARTUP
// ====================================================
// Conecta aos bancos de dados (PostgreSQL via Prisma + MongoDB via Mongoose)
// e então inicia o servidor Fastify.

async function start() {
  const prisma = getPrisma()
  const app = buildApp({ prisma })

  // Conecta ao MongoDB (usado para armazenar dietas geradas pela IA)
  try {
    await mongoose.connect(env.MONGODB_URI)
    app.log.info(`MongoDB connected: ${env.MONGODB_URI}`)

    // Seeds idempotentes — populam as bases se ainda não existirem
    const exerciseCount = await seedExercises()
    app.log.info(`Exercise seed: ${exerciseCount} exercises checked`)

    const foodCount = await seedFoods()
    app.log.info(`Food seed: ${foodCount} foods checked`)
  } catch (err) {
    app.log.error(err, 'Failed to connect to MongoDB')
    process.exit(1)
  }

  // Desconecta o Mongoose quando o app encerrar
  app.addHook('onClose', async () => {
    await mongoose.disconnect()
  })

  app.listen({ port: env.PORT, host: env.HOST }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    app.log.info(`Nutri API running at ${address}`)
  })
}

start()
