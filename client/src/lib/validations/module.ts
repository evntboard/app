import * as z from "zod"

export const moduleSchema = z.object({
  id: z.string().optional(),
  code: z.string(),
  name: z.string(),
  params: z.array(
    z.object({
      id: z.string().optional(),
      key: z.string(),
      value: z.string(),
    })
  )
})