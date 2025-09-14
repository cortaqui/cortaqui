"use client"
import type React from "react"
import { useIsMobile } from "~/hooks/use-mobile"
import { Logo } from "~/components/logo"
import { ClerkAuthButtons } from "~/components/ClerkAuthButtons"
import { MobileNavSheet } from "~/components/MobileNavSheet"
import Link from "next/link"
import { CalendarDays, History, User } from "lucide-react"
import { usePathname } from "next/navigation"
import { SidebarProvider } from "~/components/ui/sidebar"

export default function BarbeiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const headerText = pathname?.includes("/barbeiro/historico-servicos") ? "Histórico" : "Agenda"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo text={headerText} />
            {isMobile ? (
              <div className="flex items-center gap-3">
                <ClerkAuthButtons />
                <MobileNavSheet
                  items={[
                    { title: "Agenda", url: "/barbeiro/agenda", icon: CalendarDays },
                    { title: "Histórico", url: "/barbeiro/historico-servicos", icon: History },
                    { title: "Agendar", url: "/agendar", icon: CalendarDays },
                    { title: "Meus Agendamentos", url: "/meus-agendamentos", icon: User },
                  ]}
                />
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <nav className="flex items-center gap-4">
                  <Link href="/barbeiro/agenda" className="text-sm hover:underline">
                    Agenda
                  </Link>
                  <Link href="/barbeiro/historico-servicos" className="text-sm hover:underline">
                    Histórico
                  </Link>
                  <Link href="/agendar" className="text-sm hover:underline">
                    Agendar
                  </Link>
                  <Link href="/meus-agendamentos" className="text-sm hover:underline">
                    Meus Agendamentos
                  </Link>
                </nav>
                <ClerkAuthButtons />
              </div>
            )}
          </div>
        </div>
      </header>
      <SidebarProvider>
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>
      </SidebarProvider>
    </div>
  )
}
