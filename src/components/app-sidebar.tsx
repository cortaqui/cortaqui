"use client"

import type * as React from "react"
import { BarChart3, Calendar, Scissors, Users, UserCheck, Clock, Home } from "lucide-react"

import { NavMain } from "~/components/nav-main"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "~/components/ui/sidebar"
import { Logo } from "./logo"
import { ClerkAuthButtons } from "./ClerkAuthButtons"

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
      title: "Métricas",
      url: "/admin/relatorios",
      icon: BarChart3,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
          <ClerkAuthButtons />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
