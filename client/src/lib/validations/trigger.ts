import * as z from "zod"

export const triggerSchema = z.object({
  name: z.string().refine((value) => /^\/(?:[^\/]+\/)*[^\/]+$/.test(value), 'Name should be a valid path'),
  code: z.string(),
  channel: z.string().min(0),
  enable: z.boolean(),
  conditions: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      enable: z.boolean(),
      code: z.string(),
      type: z.string(),
      timeout: z.number(),
    })
  )
})