import { z } from 'zod'

// z.object() → define o formato esperado do JSON
// z.string() → deve ser uma string
// .email() → deve ser um email válido
// .min(8) → mínimo de 8 caracteres
//
// Se o dado NÃO bater com o schema, o Zod lança um erro
// com mensagens claras (ex: "Email inválido")
// Isso protege contra dados malformados E dá feedback pro usuário.

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .transform((e) => e.toLowerCase().trim()),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(8, 'Senha deve ter pelo menos 8 caracteres'),
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
})

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .email('Email inválido')
    .transform((e) => e.toLowerCase().trim()),
  password: z.string({ required_error: 'Senha é obrigatória' }),
})

export const refreshSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token é obrigatório' }),
})

// z.infer<typeof schema> → extrai o TIPO TypeScript do schema Zod
// Isso é poderoso: você define a validação UMA vez
// e ganha o tipo de graça, sem duplicar código.
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
