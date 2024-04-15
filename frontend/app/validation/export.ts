import * as z from 'zod'

export const exportFormSchema = z.object({
  path: z.string()
});