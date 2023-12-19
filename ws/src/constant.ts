import * as process from 'node:process'

export const REDIS_URL = process.env.REDIS_URL ?? ''
export const APP_PORT = parseInt(process.env.PORT ?? "3001", 10)