import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetcher,
  useLoaderData,
} from '@remix-run/react'
import { json, LinksFunction, LoaderFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node'

import stylesheet from '~/globals.css?url'
import { getThemeFromCookie } from '~/utils/theme.server'
import { ThemeProvider } from '~/components/theme-provider'
import { TooltipProvider } from '~/components/ui/tooltip'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
]

export const meta: MetaFunction = () => {
  return [
    { title: 'EvntBoard' },
    { name: 'description', content: 'Your next streaming tool!' },
  ]
}

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const theme = await getThemeFromCookie(request)
  return json({
    theme,
  })
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>()
  return (
    <html lang="en" className={data?.theme ?? 'system'}>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <Meta />
      <Links />
    </head>
    <body>
    {children}
    <ScrollRestoration />
    <Scripts />
    </body>
    </html>
  )
}

export default function App() {
  const { theme = 'system' } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const onThemeChange = (theme: string) => {
    fetcher.submit(
      { theme },
      {
        method: 'post',
        encType: 'application/json',
        action: '/theme',
      },
    )
  }

  return (
    <ThemeProvider
      defaultTheme={theme}
      onThemeChange={onThemeChange}
    >
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
    </ThemeProvider>
  )
}
