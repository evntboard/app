import { LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { ClientResponseError } from 'pocketbase'

import { createSession, getPocketbase } from '~/utils/pb.server'
import { Collections } from '~/types/pocketbase'
import { cn } from '~/utils/cn'
import { buttonVariants } from '~/components/ui/button'
import { ThemeToggle } from '~/components/theme-toggle'

export async function loader(args: LoaderFunctionArgs) {
  const pb = getPocketbase(args.request)

  const token = args.params?.token

  try {
    await pb.collection(Collections.Users).confirmVerification(token ?? '')

    return createSession('/confirm-email', pb)
  } catch (e) {
    if (e instanceof ClientResponseError) {
      return {
        errors: {
          ...e.data.data,
          global: {
            message: e.data.message,
          },
        },
      }
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

export default function ConfirmEmail() {
  const loaderData = useLoaderData<typeof loader>()
  return (
    <div
      className="container relative min-h-screen flex-col items-center justify-center grid"
    >
      <div className="absolute right-4 top-4 md:right-8 md:top-8">
        <ThemeToggle />
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Email validation
            </h1>
            {loaderData?.errors?.global && (
              <>
                <p className={cn('text-sm text-destructive-foreground')}>
                  {loaderData?.errors?.global?.message}
                </p>
                <Link
                  to="/register"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute left-4 top-4 md:left-8 md:top-8',
                  )}
                >
                  Go back
                </Link>
              </>
            )}
            {!loaderData?.errors && (
              <>
                <p className={cn('text-sm text-muted-foreground')}>
                  Your email has been validated. You may now proceed to Sign in !
                </p>
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'absolute left-4 top-4 md:left-8 md:top-8',
                  )}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
