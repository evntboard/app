import * as z from "zod"

export const organizationSchema = z.object({
  name: z.string().min(3).max(128),
})