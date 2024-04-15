import * as z from 'zod'

export const triggerFormSchema = z.object({
  name: z.string().refine((value: string) => /^\/(?:[^/]+\/)*[^/]+$/.test(value), 'Name should be a valid path'),
  code: z.string(),
  channel: z.string(),
});

export const triggerConditionCreateFormSchema = z.object({
  name: z.string(),
});


export const triggerConditionUpdateFormSchema = z.object({
  name: z.string(),
  enable: z.boolean(),
  code: z.string(),
  type: z.string(),
  timeout: z.number()
});

export const triggerCreateFormSchema = z.object({
  name: z.string().refine((value) => /^\/(?:[^/]+\/)*[^/]+$/.test(value), 'Name should be a path'),
})

export const triggerDuplicateFormSchema = z.object({
  targetPath: z.string().refine((value) => /^\/(?:[^/]+\/)*[^/]+$/.test(value), 'Name should be a path'),
})

export const triggerConditionDuplicateFormSchema = z.object({
  targetPath: z.string(),
})