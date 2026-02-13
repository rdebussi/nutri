// Tipos do módulo de autenticação.
//
// Em TypeScript, "type" e "interface" servem para
// definir o FORMATO de um objeto. A diferença principal:
// - interface: pode ser "extendida" (herança)
// - type: mais flexível (unions, intersections)
//
// Aqui usamos type por simplicidade. Ambos funcionam.

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

// Omit<User, 'password'> → pega todos os campos de User
// EXCETO password. Nunca retornamos a senha pro frontend.
export type SafeUser = {
  id: string
  email: string
  name: string
  role: string
  createdAt: Date
}

export type AuthResponse = {
  user: SafeUser
  tokens: AuthTokens
}
