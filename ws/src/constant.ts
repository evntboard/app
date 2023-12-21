import * as process from 'node:process'

export const DATABASE_URL = process.env.DATABASE_URL ?? ''
export const APP_PORT = parseInt(process.env.PORT ?? "3001", 10)