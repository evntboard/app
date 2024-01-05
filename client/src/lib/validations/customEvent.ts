import * as z from "zod"

export const customEventSchema = z.object({
    name: z.string(),
    description: z.string(),
    payload: z.any()
})
