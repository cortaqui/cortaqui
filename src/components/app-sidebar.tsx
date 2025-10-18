"use client"

import type * as React from "react"
import { BarChart3, Calendar, Scissors, Users, UserCheck, Clock, Home } from "lucide-react"

import { NavMain } from "~/components/nav-main"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "~/components/ui/sidebar"
import { Logo } from "./logo"
import { ClerkAuthButtons } from "./ClerkAuthButtons"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ModalHelp } from "~/components/ModalHelp"
import { Button } from "~/components/ui/button"
import { HelpCircle } from "lucide-react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Agendamentos",
      url: "/admin/agendamentos",
      icon: Calendar,
    },
    {
      title: "Serviços",
      url: "/admin/servicos",
      icon: Scissors,
    },
    {
      title: "Barbeiros",
      url: "/admin/barbeiros",
      icon: UserCheck,
    },
    {
      title: "Clientes",
      url: "/admin/clientes",
      icon: Users,
    },
    {
      title: "Disponibilidade",
      url: "/admin/disponibilidade",
      icon: Clock,
    },
    {
      title: "Relatórios",
      url: "/admin/relatorios",
      icon: BarChart3,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [helpOpen, setHelpOpen] = useState(false)

  // F1 opens help only in /admin routes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F1") {
        if (typeof pathname === 'string' && pathname.startsWith("/admin")) {
          e.preventDefault()
          setHelpOpen(true)
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [pathname])

  const isAdmin = typeof pathname === 'string' && pathname.startsWith("/admin")

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center py-2 px-1">
            <Logo text="" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2 py-4 px-1">
          {isAdmin && (
            <>
              <Button variant="outline" size="icon" aria-label="Ajuda (F1)" onClick={() => setHelpOpen(true)}>
                <HelpCircle className="h-4 w-4" />
              </Button>
              <ModalHelp open={helpOpen} onOpenChange={setHelpOpen} pathname={pathname} />
            </>
          )}
          <ClerkAuthButtons />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
