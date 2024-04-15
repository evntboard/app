import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node'
import { Form as RForm, useActionData, Link, useSubmit, useNavigation } from '@remix-run/react'
import { ClientResponseError } from 'pocketbase'

import { createSession, getPocketbase, getUser } from '~/utils/pb.server'
import { Collections } from '~/types/pocketbase'
import { registerFormSchema } from '~/validation/auth'
import { Input } from '~/components/ui/input'
import { cn } from '~/utils/cn'
import { Button, buttonVariants } from '~/components/ui/button'
import { Icons } from '~/components/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useEffect } from 'react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { ThemeToggle } from '~/components/theme-toggle';

export async function action({ request }: ActionFunctionArgs) {
  const pb = getPocketbase(request)

  const formValues = Object.fromEntries(await request.formData())
  const result = registerFormSchema.safeParse(formValues)

  if (result.success) {
    try {
      await pb.collection(Collections.Users).create({
          email: result.data.email,
          password: result.data.password,
          passwordConfirm: result.data.passwordConfirm,
        },
      )

      await pb.collection(Collections.Users).requestVerification(result.data.email);

      return createSession('/login', pb)
    } catch (e) {
      if (e instanceof ClientResponseError) {
        return json({
          errors: {
            ...e.data.data,
            global: {
              message: e.data.message,
            },
          },
        })
      }
      return json({
        errors: {
          global: {
            message: 'Unknown error ...',
          },
        },
      })
    }
  }

  const errorsFormatted = result.error.issues.reduce((acc, currentValue) => {
    return {
      ...acc,
      [currentValue.path.join('.')]: {
        type: currentValue.code,
        message: currentValue.message,
      },
    }
  }, {})

  return json({ errors: errorsFormatted })
}

export async function loader({ request }: LoaderFunctionArgs) {
  const pb = getPocketbase(request)
  const user = getUser(pb)

  const redirectUrl = '/'

  if (user) return createSession(redirectUrl, pb)

  return json({ redirectUrl, user })
}

export default function Login() {
  const actionData = useActionData<{ errors: Record<string, { message: string }> }>()
  const submit = useSubmit()
  const navigation = useNavigation()

  const resolver = zodResolver(registerFormSchema)
  const form = useForm<z.infer<typeof registerFormSchema>>({
    resolver,
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const currentTarget = e.currentTarget
    form.handleSubmit(() => {
      submit(currentTarget)
    })(e)
  }

  useEffect(() => {
    if (actionData?.errors) {
      Object.entries(actionData?.errors)
        .forEach(([name, error]) => {
          form.setError(name as never, { message: error?.message as string })
        })
    }
  }, [actionData, form])

  return (
    <div
      className="container relative min-h-screen flex-col items-center justify-center grid"
    >
      <Link
        to="/login"
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'absolute left-4 top-4 md:left-8 md:top-8',
        )}
      >
        Login
      </Link>
      <div className="absolute right-4 top-4 md:right-8 md:top-8">
        <ThemeToggle />
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your infos below to create your account
            </p>
          </div>

          <div className="grid gap-6">
            <Form {...form}>
              <RForm
                method="POST"
                className="flex flex-col gap-2 px-1"
                action="/register"
                onSubmit={handleSubmit}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Confirm password
                      </FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {actionData?.errors?.global && (
                  <p className={cn('text-sm font-medium text-destructive')}>
                    {actionData?.errors?.global?.message}
                  </p>
                )}
                <Button type="submit" className={cn(buttonVariants(), 'flex gap-2')}>
                  Continue{' '}
                  <Icons.spinner
                    className={cn('mr-2 h-4 w-4animate-spin', navigation.state == 'idle' ? 'hidden' : '')} />
                </Button>
              </RForm>
            </Form>
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <Link
              to="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
