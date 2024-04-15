import * as z from 'zod'

export const registerFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
})

export const loginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})