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
  const [receitaDeltaPct, setReceitaDeltaPct] = useState(0)
  const [novosClientesDeltaPct, setNovosClientesDeltaPct] = useState(0)
  const [totalAgendamentosDeltaPct, setTotalAgendamentosDeltaPct] = useState(0)
  // chart now fetches its own data

  useEffect(() => {
    // Buscar dados reais das APIs, considerando mês atual e comparativos com mês anterior
    const fetchAll = async () => {
      try {
        const results = (await Promise.all([
          fetch("/api/agendamentos").then((r) => (r.ok ? r.json() : Promise.resolve([]))),
          fetch("/api/admin/clientes").then((r) => (r.status === 200 ? r.json() : Promise.resolve([]))),
        ])) as unknown[]
        const agRes = results[0]
        const cliRes = results[1]
        const ag = (Array.isArray(agRes) ? agRes : []) as Array<{ dataHoraInicio?: string; data_hora?: string; valorCobrado?: string | number; status?: string }>

        const now = new Date()
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        const inRange = (iso?: string, start?: Date, end?: Date) => {
          if (!iso || !start || !end) return false
          const d = new Date(iso)
          return d >= start && d <= end
        }

        const thisMonthAg = ag.filter((a) => inRange(a.dataHoraInicio ?? a.data_hora, startOfThisMonth, now))
        const lastMonthAg = ag.filter((a) => inRange(a.dataHoraInicio ?? a.data_hora, startOfLastMonth, endOfLastMonth))

        setTotalAgendamentos(thisMonthAg.length)

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
        const receitaThis = thisMonthAg.reduce((acc, a) => acc + (a.status === 'CONCLUIDO' && a.valorCobrado ? Number(a.valorCobrado) : 0), 0)
        const receitaLast = lastMonthAg.reduce((acc, a) => acc + (a.status === 'CONCLUIDO' && a.valorCobrado ? Number(a.valorCobrado) : 0), 0)
        setReceitaTotal(receitaThis)
        setReceitaDeltaPct(receitaLast > 0 ? ((receitaThis - receitaLast) / receitaLast) * 100 : (receitaThis > 0 ? 100 : 0))

        const clientsArr = (Array.isArray(cliRes) ? (cliRes as Array<Record<string, unknown>>) : [])
        const novosCliThis = clientsArr.filter((c) => {
          const created = (c.createdAt as string | undefined) ?? (c.created_at as string | undefined)
          return created ? new Date(created) >= startOfThisMonth && new Date(created) <= now : false
        }).length
        const novosCliLast = clientsArr.filter((c) => {
          const created = (c.createdAt as string | undefined) ?? (c.created_at as string | undefined)
          return created ? new Date(created) >= startOfLastMonth && new Date(created) <= endOfLastMonth : false
        }).length
        setNovosClientes(novosCliThis)
        setNovosClientesDeltaPct(novosCliLast > 0 ? ((novosCliThis - novosCliLast) / novosCliLast) * 100 : (novosCliThis > 0 ? 100 : 0))

        const totalDeltaPct = lastMonthAg.length > 0 ? ((thisMonthAg.length - lastMonthAg.length) / lastMonthAg.length) * 100 : (thisMonthAg.length > 0 ? 100 : 0)
        setTotalAgendamentosDeltaPct(totalDeltaPct)
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
              receitaDeltaPct={receitaDeltaPct}
              novosClientesDeltaPct={novosClientesDeltaPct}
              totalAgendamentosDeltaPct={totalAgendamentosDeltaPct}
              agendamentosHojeDeltaPct={0}
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
