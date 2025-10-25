"use client"

import React, { useEffect } from "react"
import { useState } from "react"
import { HelpCircle } from "lucide-react"
import { AppSidebar } from "~/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb"
import { Separator } from "~/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { ModalHelp } from "~/components/ModalHelp"

interface BreadcrumbItem {
  label: string
  href: string
}

const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Admin", href: "/admin" }]

  if (segments.length >= 2 && segments[1]) {
    const pageMap: Record<string, string> = {
      dashboard: "Dashboard",
      agendamentos: "Agendamentos",
      servicos: "Serviços",
      barbeiros: "Barbeiros",
      clientes: "Clientes",
      disponibilidade: "Disponibilidade",
      relatorios: "Métricas",
    }
    const segment = segments[1]
    const label = pageMap[segment] ?? segment
    breadcrumbs.push({ label, href: `/admin/${segment}` })
  }

  return breadcrumbs
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "F1") {
        e.preventDefault()
        setIsHelpOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [pathname])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1
                  return (
                    <React.Fragment key={crumb.label}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open help modal"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
        </header>
        <ModalHelp open={isHelpOpen} onOpenChange={setIsHelpOpen} pathname={pathname} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
