import * as z from "zod"

export const realtimeEventSchema = z.object({
    name: z.string()
})
