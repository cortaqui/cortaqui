"use client"

import type * as React from "react"
import { BarChart3, Calendar, Scissors, Users, UserCheck, Clock, Settings2, Home } from "lucide-react"

import { NavMain } from "~/components/nav-main"
import { NavUser } from "~/components/nav-user"
import { TeamSwitcher } from "~/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "~/components/ui/sidebar"

// Dados da barbearia Cortaqui
const data = {
  user: {
    name: "João Silva",
    email: "joao@cortaqui.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  teams: [
    {
      name: "Cortaqui",
      logo: Scissors,
      plan: "Barbearia",
    },
  ],
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
