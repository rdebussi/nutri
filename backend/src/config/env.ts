export const env = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nutri',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  DIET_CACHE_TTL: Number(process.env.DIET_CACHE_TTL) || 21600, // 6h em segundos
} as const
