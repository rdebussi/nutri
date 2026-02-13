import { buildApp } from './app.js'
import { env } from './config/env.js'
import { getPrisma } from './shared/database/prisma.js'

const prisma = getPrisma()
const app = buildApp({ prisma })

app.listen({ port: env.PORT, host: env.HOST }, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
  app.log.info(`Nutri API running at ${address}`)
})
