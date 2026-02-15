import { PrismaClient } from '@prisma/client'

// ====================================================
// INSTÂNCIA DO PRISMA
// ====================================================
// Singleton: criamos UMA instância do Prisma e reutilizamos
// em toda a aplicação. Se criássemos uma nova a cada request,
// teríamos milhares de conexões abertas com o banco (ruim!).
//
// O "!" no final (non-null assertion) é TypeScript dizendo:
// "confia, essa variável não vai ser null". Usamos aqui porque
// o Prisma precisa da DATABASE_URL configurada em runtime.

let prisma: PrismaClient

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}
