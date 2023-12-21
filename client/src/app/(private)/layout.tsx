import React from "react";
import {notFound} from "next/navigation"

import {dashboardConfig} from "@/config/dashboard"
import {getCurrentUser} from "@/lib/session"
import {ModeToggle} from "@/components/mode-toggle";

import {MainNav} from "./main-nav"
import {UserAccountNav} from "./user-account-nav"

interface DashboardLayoutProps {
  children?: React.ReactNode
}

export default async function DashboardLayout({children}: DashboardLayoutProps) {
  const user = await getCurrentUser()

  if (!user) {
    return notFound()
  }

  return (
    <div className="flex flex-col h-screen w-screen space-y-6">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav items={dashboardConfig.mainNav}/>
          <div className="flex gap-4">
            <ModeToggle/>
            <UserAccountNav
              user={{
                name: user.name,
                image: user.image,
                email: user.email,
              }}
            />
          </div>
        </div>
      </header>
      <div className="container flex flex-col md:flex-row flex-1 gap-4 overflow-auto">
        {children}
      </div>
    </div>
  )
}
