import { z } from 'zod'

export const sessionRegisterSchema = z.object({
  code: z.string(),
  name: z.string(),
  token: z.string(),
  subs: z.array(z.string()).optional()
})

export const eventNewSchema = z.object({
  name: z.string().min(3),
  payload: z.any()
})


export const storageGetSchema = z.object({
  key: z.string()
})

export const storageSetSchema = z.object({
  key: z.string(),
  value: z.any(),
  isTemp: z.boolean(),
})
