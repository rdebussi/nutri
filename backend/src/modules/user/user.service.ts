import type { PrismaClient } from '../../generated/prisma/client.js'
import type { UpdateProfileInput } from './user.validator.js'
import { NotFoundError } from '../../shared/utils/errors.js'

// ====================================================
// USER SERVICE
// ====================================================
// Gerencia o perfil do usuário e seus dados nutricionais.
// Mesma ideia do AuthService: lógica de negócio pura,
// sem saber nada de HTTP.

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(userId: string) {
    // findUnique + include → busca o usuário E o perfil numa só query.
    // Sem o include, precisaríamos de 2 queries separadas.
    // O Prisma gera um JOIN otimizado no SQL.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) {
      throw new NotFoundError('Usuário não encontrado')
    }

    // Retorna sem a senha
    const { password, ...safeUser } = user
    return safeUser
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    // "upsert" é uma operação atômica (INSERT ou UPDATE).
    // Se o perfil já existe para esse userId → UPDATE
    // Se não existe → INSERT (cria novo)
    //
    // É mais seguro que fazer findFirst + create/update separados,
    // porque evita race conditions (duas requests simultâneas
    // tentando criar o mesmo perfil).
    const profile = await this.prisma.nutritionProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    return profile
  }
}
