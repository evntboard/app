"use client"

import React, {ReactNode} from "react";
import {Session} from "next-auth";
import {SessionProvider} from "next-auth/react";
import {ThemeProvider} from "@/components/theme-provider";
import {TailwindIndicator} from "@/components/tailwind-indicator";
import {Toaster} from "@/components/ui/toaster";
import {TooltipProvider} from "@/components/ui/tooltip";

type Props = {
  children: ReactNode,
  session: Session | null
}

export const Providers = ({children, session}: Props) => {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <TailwindIndicator/>
        <Toaster/>
      </ThemeProvider>
    </SessionProvider>
  )
}