export const env = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nutri',
} as const
