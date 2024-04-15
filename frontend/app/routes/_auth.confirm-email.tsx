import { Link } from '@remix-run/react'

import { cn } from '~/utils/cn'
import { buttonVariants } from '~/components/ui/button'
import { ThemeToggle } from '~/components/theme-toggle'

export default function ConfirmEmail() {
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
            <p className={cn('text-sm text-muted-foreground')}>
              Your email has been validated. You may now proceed to Sign in !
            </p>
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
