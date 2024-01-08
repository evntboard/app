import {ReactNode} from "react";
import {Metadata, Viewport} from "next"

import {auth} from "@/lib/auth";
import {siteConfig} from "@/config/site"
import {fontSans} from "@/lib/fonts"
import {cn} from "@/lib/utils"
import {Providers} from "@/components/providers";

import "@/styles/globals.css"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    {media: "(prefers-color-scheme: light)", color: "white"},
    {media: "(prefers-color-scheme: dark)", color: "black"},
  ],
}

interface RootLayoutProps {
  children: ReactNode
}

export default async function RootLayout({children}: RootLayoutProps) {
  const session = await auth() // force to Session cause login is required !

  console.log(session)
  return (
    <>
      <html lang="en" suppressHydrationWarning>
      <head/>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
      <Providers session={session}>
        {children}
      </Providers>
      </body>
      </html>
    </>
  )
}