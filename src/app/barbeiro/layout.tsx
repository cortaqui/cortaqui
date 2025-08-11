import type React from "react"

export default function BarbeiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Barbeiro</h1>
            </div>
            <nav className="flex items-center gap-4">
              <a href="/barbeiro/agenda" className="text-sm hover:underline">
                Agenda
              </a>
              <a href="/barbeiro/historico-servicos" className="text-sm hover:underline">
                Histórico
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
