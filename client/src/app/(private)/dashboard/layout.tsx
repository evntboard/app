import {ReactNode} from "react";
import {notFound} from "next/navigation"

import {dashboardConfig} from "@/config/dashboard"
import {getCurrentUser} from "@/lib/session"

import {DashboardNav} from "./nav"

interface Props {
  children?: ReactNode
}

export default async function DashboardLayout({children}: Props) {
  const user = await getCurrentUser()

  if (!user) {
    return notFound()
  }

  return (
    <div className="grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
      <aside className="hidden w-[200px] flex-col md:flex">
        <DashboardNav items={dashboardConfig.sidebarNav}/>
      </aside>
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
