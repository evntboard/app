import * as z from 'zod'

export const userUsernameFormSchema = z.object({
  name: z.string().min(4),
})

export const userPasswordFormSchema = z.object({
  oldPassword: z.string().min(8),
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
})