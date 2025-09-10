"use client"

import {} from "~/components/ui/card"
import { SectionCards } from "~/components/section-cards"
import { AgendamentoChart } from "~/components/AgendamentoChart"
import { useEffect, useState } from "react"

export default function Page() {
  const [receitaTotal, setReceitaTotal] = useState(0)
  const [novosClientes, setNovosClientes] = useState(0)
  const [totalAgendamentos, setTotalAgendamentos] = useState(0)
  const [agendamentosHoje, setAgendamentosHoje] = useState(0)
  // chart now fetches its own data

  useEffect(() => {
    // Buscar dados reais das APIs
    const fetchAll = async () => {
      try {
        const results = (await Promise.all([
          fetch("/api/agendamentos").then((r) => (r.ok ? r.json() : Promise.resolve([]))),
          fetch("/api/admin/clientes").then((r) => (r.status === 200 ? r.json() : Promise.resolve([]))),
        ])) as unknown[]
        const agRes = results[0]
        const cliRes = results[1]
        const ag = (Array.isArray(agRes) ? agRes : []) as Array<{ dataHoraInicio?: string; data_hora?: string; valorCobrado?: string; status?: string }>
        setTotalAgendamentos(ag.length)
        const hoje = new Date()
        const hojeStr = hoje.toDateString()
        setAgendamentosHoje(
          ag.filter((a) => {
          const iso = a.dataHoraInicio ?? a.data_hora
            if (!iso) return false
            return new Date(iso).toDateString() === hojeStr
          }).length,
        )
        // Receita somente para CONCLUIDO
        const receita = ag.reduce((acc, a) => acc + (a.status === 'CONCLUIDO' && a.valorCobrado ? Number(a.valorCobrado) : 0), 0)
        setReceitaTotal(receita)
        setNovosClientes(Array.isArray(cliRes as unknown[]) ? (cliRes as unknown[]).length : 0)
      } catch {
        // manter valores padrão
      }
    }
    void fetchAll()
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Cards de Métricas usando SectionCards */}
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards
              receitaTotal={receitaTotal}
              novosClientes={novosClientes}
              totalAgendamentos={totalAgendamentos}
              agendamentosHoje={agendamentosHoje}
            />
            <div className="px-4 lg:px-6">
              <AgendamentoChart />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
