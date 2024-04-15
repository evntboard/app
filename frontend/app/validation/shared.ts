import * as z from 'zod'

export const sharedCreateFormSchema = z.object({
  name: z.string().refine((value) => /^\/(?:[^/]+\/)*[^/]+$/.test(value), 'Name should be a path'),
})

export const sharedFormSchema = z.object({
  name: z.string().refine((value) => /^\/(?:[^/]+\/)*[^/]+$/.test(value), 'Name should be a path'),
  code: z.string(),
})

export const sharedDuplicateFormSchema = z.object({
  targetPath: z.string().refine((value) => /^\/(?:[^/]+\/)*[^/]+$/.test(value), 'Name should be a path'),
})