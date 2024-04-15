import * as z from 'zod'

export const importFormSchema = z.object({
  path: z.string(),
  file: z.any()
})