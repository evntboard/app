import { z } from 'zod'

export const sessionRegisterSchema = z.object({
  code: z.string(),
  name: z.string(),
  token: z.string(),
  subs: z.array(z.string()).optional()
})

export const eventNewSchema = z.object({
  name: z.string(),
  payload: z.any()
})
