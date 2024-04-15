import * as z from 'zod';

export const eventCreateFormSchema = z.object({
  name: z.string().min(3),
  payload: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (_) {
      return false;
    }
  })
});

export const eventUpdateFormSchema = z.object({
  name: z.string().min(3),
  payload: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (_) {
      return false;
    }
  })
});