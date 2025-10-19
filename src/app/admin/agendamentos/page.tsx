"use client"

import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Plus, Calendar, Table } from 'lucide-react'
import type { Agendamento } from "~/lib/types"
import { PageHeader } from "~/components/PageHeader"
import { AgendamentosDataTable } from "~/components/tables/AgendamentosDataTable"
import { AgendamentosCalendar } from "~/components/AgendamentosCalendar"
import { CalendarProvider } from "~/components/event-calendar/calendar-context"
import { ModalAgendamentoCliente } from "~/components/ModalAgendamentoCliente"
import { ModalEditarAgendamento } from "~/components/ModalEditarAgendamento"
import { ModalConfirmar } from "~/components/ModalConfirmar"

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState<Agendamento | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [resAg, resClientes, resBarbeiros, resServicos] = await Promise.all([
          fetch("/api/agendamentos", { cache: "no-store" }),
          fetch("/api/admin/clientes?includeDeleted=1", { cache: "no-store" }),
          fetch("/api/admin/barbeiros?includeDeleted=1", { cache: "no-store" }),
          fetch("/api/admin/servicos", { cache: "no-store" }),
        ])
        if (!resAg.ok) return
        const rows: unknown = await resAg.json()
        const clientes = resClientes.ok ? await resClientes.json() as Array<Record<string, unknown>> : []
        const barbeiros = resBarbeiros.ok ? await resBarbeiros.json() as Array<Record<string, unknown>> : []
        const servicos = resServicos.ok ? await resServicos.json() as Array<Record<string, unknown>> : []
        const clientesMap = new Map<string, { id: string; nome: string; email: string; telefone?: string }>()
        for (const c of clientes) {
          const id = typeof c.userId === 'string' ? c.userId : (typeof c.id === 'string' ? c.id : '')
          if (!id) continue
          clientesMap.set(id, { id, nome: (typeof c.nome === 'string' ? c.nome : ''), email: (typeof c.email === 'string' ? c.email : ''), telefone: typeof c.telefone === 'string' ? c.telefone : undefined })
        }
        const barbeirosMap = new Map<string, { id: string; nome: string; email: string; telefone?: string }>()
        for (const b of barbeiros) {
          const id = typeof b.userId === 'string' ? b.userId : (typeof b.id === 'string' ? b.id : '')
          if (!id) continue
          barbeirosMap.set(id, { id, nome: (typeof b.nome === 'string' ? b.nome : ''), email: (typeof b.email === 'string' ? b.email : ''), telefone: typeof b.telefone === 'string' ? b.telefone : undefined })
        }
        const servicosMap = new Map<string, { id: string; nome: string; duracao_minutos: number; preco_base: number; ativo: boolean }>()
        for (const s of servicos) {
          const id = typeof s.servicoId === 'string' ? s.servicoId : (typeof s.id === 'string' ? s.id : '')
          if (!id) continue
          servicosMap.set(id, {
            id,
            nome: (typeof s.nome === 'string' ? s.nome : ''),
            duracao_minutos: Number((s.duracaoMinutos as number | undefined) ?? (s.duracao_minutos as number | undefined) ?? 30),
            preco_base: Number((s.precoBase as string | number | undefined) ?? (s.preco_base as number | undefined) ?? 0),
            ativo: Boolean(s.ativo ?? true),
          })
        }
        // map API shape -> UI shape if needed; here assume compatible and coerce dates
        const mapped: Agendamento[] = Array.isArray(rows) ? rows.map((r) => {
          const anyR = r as Record<string, unknown>
          const fkClienteId = typeof anyR.fkClienteId === 'string' ? anyR.fkClienteId : (typeof anyR.cliente_user_id === 'string' ? anyR.cliente_user_id : '')
          const fkBarbeiroId = typeof anyR.fkBarbeiroId === 'string' ? anyR.fkBarbeiroId : (typeof anyR.barbeiro_user_id === 'string' ? anyR.barbeiro_user_id : '')
          const fkServicoId = typeof anyR.fkServicoId === 'string' ? anyR.fkServicoId : (typeof anyR.servico_id === 'string' ? anyR.servico_id : '')
          const statusStr = typeof anyR.status === 'string' ? anyR.status : 'PENDENTE'
          const serv = (anyR.servico && typeof anyR.servico === 'object') ? (anyR.servico as Record<string, unknown>) : undefined
          return {
            id: String(anyR.agendamentoId ?? anyR.id),
            cliente_user_id: fkClienteId,
            barbeiro_user_id: fkBarbeiroId,
            servico_id: fkServicoId,
            data_hora: new Date((anyR.dataHoraInicio as string) ?? (anyR.data_hora as string)),
            status: statusStr.toLowerCase() as Agendamento["status"],
            preco_final: Number((anyR.valorCobrado as string | number | undefined) ?? (anyR.preco_final as number | undefined) ?? 0),
            observacoes: (anyR.observacoesCliente as string | undefined) ?? (anyR.observacoes as string | undefined),
            created_at: new Date((anyR.dataCadastro as string | undefined) ?? (anyR.created_at as string | undefined) ?? Date.now()),
            updated_at: new Date((anyR.updatedAt as string | undefined) ?? (anyR.updated_at as string | undefined) ?? Date.now()),
            cliente: (clientesMap.get(fkClienteId) ?? barbeirosMap.get(fkClienteId)) as unknown as Agendamento["cliente"] | undefined,
            barbeiro: barbeirosMap.get(fkBarbeiroId) as unknown as Agendamento["barbeiro"] | undefined,
            servico: serv
              ? {
                  id: typeof serv.servicoId === 'string' ? serv.servicoId : (typeof serv.id === 'string' ? serv.id : ''),
                  nome: typeof serv.nome === 'string' ? serv.nome : '',
                  descricao: (serv.descricao as string | undefined) ?? undefined,
                  duracao_minutos: Number((serv.duracaoMinutos as number | undefined) ?? (serv.duracao_minutos as number | undefined) ?? 30),
                  preco_base: Number((serv.precoBase as string | number | undefined) ?? (serv.preco_base as number | undefined) ?? 0),
                  ativo: Boolean((serv.ativo as boolean | undefined) ?? true),
                  created_at: new Date((serv.created_at as string | undefined) ?? Date.now()),
                  updated_at: new Date((serv.updatedAt as string | undefined) ?? (serv.updated_at as string | undefined) ?? Date.now()),
                }
              : (servicosMap.get(fkServicoId) as unknown as Agendamento["servico"] | undefined),
          }
        }) : []
        setAgendamentos(mapped)
      } catch {}
    })()
  }, [])

  const handleAgendamentoSelect = (agendamento: Agendamento) => {
    setEditing(agendamento)
  }

  const handleNewAgendamento = (_date: Date) => {
    setOpenModal(true)
  }

  const handleAgendamentoUpdate = (updatedAgendamento: Agendamento) => {
    setAgendamentos(prev =>
      prev.map(agendamento =>
        agendamento.id === updatedAgendamento.id ? updatedAgendamento : agendamento
      )
    )
    console.log("Updated agendamento:", updatedAgendamento)
  }

  const handleAgendamentoDelete = async (agendamentoId: string) => {
    try {
      const res = await fetch(`/api/agendamentos/${agendamentoId}`, { method: 'DELETE' })
      if (!res.ok) console.error('Falha ao excluir agendamento', await res.text())
      setAgendamentos(prev => prev.filter(agendamento => agendamento.id !== agendamentoId))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <CalendarProvider>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <PageHeader
          title="Agendamentos"
          description="Visualize e gerencie todos os agendamentos"
          action={
            <Button onClick={() => setOpenModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agendar para Cliente
            </Button>
          }
        />

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-4">
            <AgendamentosDataTable
              agendamentos={agendamentos}
              title="Todos os Agendamentos"
              description="Lista completa de agendamentos do sistema"
              onEdit={(ag: Agendamento) => handleAgendamentoSelect(ag)}
              onDelete={(id: string) => { setConfirmDeleteId(id) }}
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-4">
                <AgendamentosCalendar
                  agendamentos={agendamentos}
                  onAgendamentoClick={handleAgendamentoSelect}
                  onNewAgendamento={handleNewAgendamento}
                  onAgendamentoUpdate={handleAgendamentoUpdate}
                  onAgendamentoDelete={handleAgendamentoDelete}
                  view="month"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <ModalAgendamentoCliente
          open={openModal}
          onOpenChange={setOpenModal}
          onAgendamentoCriado={(a) => {
            setAgendamentos((prev) => [a, ...prev])
          }}
        />

        <ModalEditarAgendamento
          open={!!editing}
          onOpenChange={(v) => { if (!v) setEditing(null) }}
          agendamento={editing}
          onAgendamentoAtualizado={(upd) => {
            setAgendamentos((prev) => prev.map((a) => a.id === upd.id ? upd : a))
            setEditing(null)
          }}
        />

        <ModalConfirmar
          open={!!confirmDeleteId}
          onOpenChange={(v) => { if (!v) setConfirmDeleteId(null) }}
          titulo="Excluir agendamento?"
          descricao="Esta ação não poderá ser desfeita."
          onConfirmar={() => {
            if (!confirmDeleteId) return
            void handleAgendamentoDelete(confirmDeleteId)
            setConfirmDeleteId(null)
          }}
        />
      </div>
    </CalendarProvider>
  )
}
