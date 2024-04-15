import * as z from 'zod'

export const organizationAddMemberFormSchema = z.object({
  userId: z.string(),
  role: z.string()
})

export const organizationUpdateMemberRoleFormSchema = z.object({
  role: z.string()
})