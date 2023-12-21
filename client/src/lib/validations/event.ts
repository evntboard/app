import * as z from "zod"

export const eventSchema = z.object({
    name: z.string(),
    payload: z.any()
})
