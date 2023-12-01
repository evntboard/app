import process from 'node:process'

export const REDIS_URL = process.env.REDIS_URL
export const APP_PORT = process.env.PORT ?? 3001