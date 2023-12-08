import * as z from "zod"

export const eventSchema = z.object({
    name: z.string(),
    description: z.string(),
    payload: z.any()
})
