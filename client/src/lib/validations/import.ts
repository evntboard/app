import * as z from "zod";

export const importSchema = z.object({
  slug: z.string().refine((value) => value === "/" || /^\/.*\/$/.test(value), 'Slug should be a valid path'),
  files: z.any().optional(),
})

export const importTriggerSchema = z.object({
  name: z.string().refine((value) => /^\/(?:[^\/]+\/)*[^\/]+$/.test(value), 'Name should be a valid path'),
  code: z.string(),
  channel: z.string().min(0),
  conditions: z.array(
    z.object({
      name: z.string(),
      code: z.string(),
      type: z.string(),
      timeout: z.number(),
    })
  )
})

export const importSharedSchema = z.object({
  name: z.string().refine((value) => /^\/(?:[^\/]+\/)*[^\/]+$/.test(value), 'Name should be a path'),
  code: z.string(),
})


export const importPostSchema = z.object({
  slug: z.string().refine((value) => value === "/" || /^\/.*\/$/.test(value), 'Slug should be a valid path'),
  triggers: z.array(importTriggerSchema),
  shareds: z.array(importSharedSchema),
})