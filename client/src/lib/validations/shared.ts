import * as z from "zod"

export const sharedSchema = z.object({
  name: z.string().refine((value) => /^\/(?:[^\/]+\/)*[^\/]+$/.test(value), 'Name should be a path'),
  code: z.string(),
  enable: z.boolean(),
})