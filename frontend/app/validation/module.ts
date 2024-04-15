import * as z from 'zod';

export const moduleCreateFormSchema = z.object({
  code: z.string(),
  name: z.string(),
  sub: z.string()
});

export const moduleUpdateFormSchema = z.object({
  code: z.string(),
  name: z.string(),
  sub: z.string()
});

export const moduleParamCreateFormSchema = z.object({
  key: z.string(),
  value: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (_) {
      return false;
    }
  })
});

export const moduleParamUpdateFormSchema = z.object({
  key: z.string(),
  value: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (_) {
      return false;
    }
  })
});