import * as z from 'zod';

export const storageCreateFormSchema = z.object({
  key: z.string()
});

export const storageUpdateFormSchema = z.object({
  key: z.string().min(3),
  value: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (_) {
      return false;
    }
  })
});