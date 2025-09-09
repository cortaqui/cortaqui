"use client"

import { useEffect, useState } from "react"
import type { Agendamento } from "~/lib/types"
import { PageHeader } from "~/components/PageHeader"
import { CalendarProvider } from "~/components/event-calendar/calendar-context"
import { AgendamentosCalendar } from "~/components/AgendamentosCalendar"

export default function AgendaBarbeiroPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/agendamentos", { cache: "no-store" })
        if (!res.ok) return
        const rows: unknown = await res.json()
        console.log("/barbeiro/agenda fetched agendamentos raw:", rows)
        const toUiStatus = (s: string | undefined): Agendamento["status"] => {
          const up = (s ?? "").toUpperCase()
          if (up === "CONFIRMADO") return "confirmado"
          if (up === "CONCLUIDO") return "concluido"
          if (up === "CANCELADO") return "cancelado"
          // PENDENTE e outros mapeiam para "agendado"
          return "agendado"
        }
        const mapped: Agendamento[] = Array.isArray(rows) ? rows.map((r) => {
          const anyR = r as Record<string, unknown>
          const fkClienteId = typeof anyR.fkClienteId === 'string' ? anyR.fkClienteId : (typeof anyR.cliente_user_id === 'string' ? anyR.cliente_user_id : '')
          const fkBarbeiroId = typeof anyR.fkBarbeiroId === 'string' ? anyR.fkBarbeiroId : (typeof anyR.barbeiro_user_id === 'string' ? anyR.barbeiro_user_id : '')
          const fkServicoId = typeof anyR.fkServicoId === 'string' ? anyR.fkServicoId : (typeof anyR.servico_id === 'string' ? anyR.servico_id : '')
          const statusStr = typeof anyR.status === 'string' ? anyR.status : 'PENDENTE'
          const servJoined = (anyR.servico && typeof anyR.servico === 'object') ? (anyR.servico as Record<string, unknown>) : undefined
          const clienteJoined = (anyR.cliente && typeof anyR.cliente === 'object') ? (anyR.cliente as Record<string, unknown>) : undefined
          const barbeiroJoined = (anyR.barbeiro && typeof anyR.barbeiro === 'object') ? (anyR.barbeiro as Record<string, unknown>) : undefined
          const item: Agendamento = {
            id: String(anyR.agendamentoId ?? anyR.id),
            cliente_user_id: fkClienteId,
            barbeiro_user_id: fkBarbeiroId,
            servico_id: fkServicoId,
            data_hora: new Date((anyR.dataHoraInicio as string) ?? (anyR.data_hora as string)),
            status: toUiStatus(statusStr),
            preco_final: Number((anyR.valorCobrado as string | number | undefined) ?? (anyR.preco_final as number | undefined) ?? 0),
            observacoes: (anyR.observacoesCliente as string | undefined) ?? (anyR.observacoes as string | undefined),
            created_at: new Date((anyR.dataCadastro as string | undefined) ?? (anyR.created_at as string | undefined) ?? Date.now()),
            updated_at: new Date((anyR.updatedAt as string | undefined) ?? (anyR.updated_at as string | undefined) ?? Date.now()),
          }
          if (servJoined) {
            item.servico = {
              id: typeof servJoined.servicoId === 'string' ? servJoined.servicoId : (typeof servJoined.id === 'string' ? servJoined.id : fkServicoId),
              nome: typeof servJoined.nome === 'string' ? servJoined.nome : '',
              descricao: (servJoined.descricao as string | undefined) ?? undefined,
              duracao_minutos: Number((servJoined.duracaoMinutos as number | undefined) ?? (servJoined.duracao_minutos as number | undefined) ?? 30),
              preco_base: Number((servJoined.precoBase as string | number | undefined) ?? (servJoined.preco_base as number | undefined) ?? 0),
              ativo: true,
              created_at: new Date(),
              updated_at: new Date(),
            }
          }
          if (clienteJoined) {
            item.cliente = {
              id: typeof clienteJoined.userId === 'string' ? clienteJoined.userId : (typeof clienteJoined.id === 'string' ? clienteJoined.id : fkClienteId),
              clerk_user_id: '',
              nome: typeof clienteJoined.nome === 'string' ? clienteJoined.nome : '',
              email: typeof clienteJoined.email === 'string' ? clienteJoined.email : '',
              telefone: typeof clienteJoined.telefone === 'string' ? clienteJoined.telefone : '',
              tipo: 'cliente',
              created_at: new Date(),
              updated_at: new Date(),
            }
          }
          if (barbeiroJoined) {
            item.barbeiro = {
              id: typeof barbeiroJoined.userId === 'string' ? barbeiroJoined.userId : (typeof barbeiroJoined.id === 'string' ? barbeiroJoined.id : fkBarbeiroId),
              clerk_user_id: '',
              nome: typeof barbeiroJoined.nome === 'string' ? barbeiroJoined.nome : '',
              email: typeof barbeiroJoined.email === 'string' ? barbeiroJoined.email : '',
              telefone: typeof barbeiroJoined.telefone === 'string' ? barbeiroJoined.telefone : '',
              tipo: 'barbeiro',
              created_at: new Date(),
              updated_at: new Date(),
            }
          }
          return item
        }) : []
        console.log("/barbeiro/agenda mapped agendamentos:", mapped)
        setAgendamentos(mapped)
      } catch {}
    })()
  }, [])

  // initialBarbeiro ensures only this barber's events are visible in calendar filters
  return (
    <CalendarProvider initialBarbeiro={agendamentos[0]?.barbeiro_user_id}>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PageHeader
          title="Minha Agenda"
          description="Visualize seus agendamentos nas diferentes visões"
        />
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-4">
            <AgendamentosCalendar
              agendamentos={agendamentos}
              onAgendamentoClick={() => { /* no-op */ }}
              view="day"
              allowedViews={["day", "agenda"]}
            />
          </div>
        </div>
      </div>
    </CalendarProvider>
  )
}
