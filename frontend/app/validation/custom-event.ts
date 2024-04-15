import * as z from 'zod';

export const customEventCreateFormSchema = z.object({
  name: z.string().min(3),
  description: z.string(),
  payload: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (_) {
      return false;
    }
  })
});

export const customEventUpdateFormSchema = z.object({
  name: z.string().min(3),
  description: z.string(),
  payload: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (_) {
      return false;
    }
  })
});

export const customEventModalCreateFormSchema = z.object({
  description: z.string(),
});