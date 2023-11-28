import * as z from "zod"

export const userNameSchema = z.object({
  name: z.string().min(3).max(32),
})

export const userIdSchema =
  z.object({
    userId: z.string(),
  })

