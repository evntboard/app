import * as z from "zod"

export const storageSchema = z.object({
  key: z.string(),
  value: z.string().refine((value) => {
    try {
      JSON.parse(value);
      return true;
    } catch (_) {
      return false;
    }
  }),
})