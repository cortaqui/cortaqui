"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Button } from "~/components/ui/button"
import type { Agendamento } from "~/lib/types"
import { ModalCancelarAgendamento } from "~/components/ModalCancelarAgendamento"
import { ModalPagamento } from "~/components/ModalPagamento"
import { AgendamentoCard } from "~/components/AgendamentoCard"
import { useIsMobile } from "~/hooks/use-mobile"
import { ClerkAuthButtons } from "~/components/ClerkAuthButtons"
import { MobileNavSheet } from "~/components/MobileNavSheet"
import { Logo } from "~/components/logo"

export default function MeusAgendamentosPage() {
  const isMobile = useIsMobile()
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false)
  const [modalPagamentoOpen, setModalPagamentoOpen] = useState(false)
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null)

  // Load my agendamentos
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/cliente/agendamentos/mine', { cache: 'no-store' })
        if (!res.ok) return
        const rowsUnknown: unknown = await res.json()
        const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as Array<{ ag: Record<string, unknown>; srv?: Record<string, unknown>; barb?: Record<string, unknown> }>) : []
        const mapped: Agendamento[] = rows.map((row) => {
          const r = row.ag
          const srv = row.srv
          const barb = row.barb
          return {
            id: typeof r.agendamentoId === 'string' ? r.agendamentoId : (typeof r.id === 'string' ? r.id : ''),
            cliente_user_id: typeof r.fkClienteId === 'string' ? r.fkClienteId : '',
            barbeiro_user_id: typeof r.fkBarbeiroId === 'string' ? r.fkBarbeiroId : '',
            servico_id: typeof r.fkServicoId === 'string' ? r.fkServicoId : '',
            data_hora: new Date(typeof r.dataHoraInicio === 'string' ? r.dataHoraInicio : new Date().toISOString()),
            status: (typeof r.status === 'string' ? r.status : 'PENDENTE').toLowerCase() as Agendamento['status'],
            preco_final: Number((r.valorCobrado as string | number | undefined) ?? (srv?.precoBase as string | number | undefined) ?? 0),
            created_at: new Date(typeof r.dataCadastro === 'string' ? r.dataCadastro : new Date().toISOString()),
            updated_at: new Date(typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString()),
            servico: srv ? {
              id: typeof srv.id === 'string' ? srv.id : '',
              nome: typeof srv.nome === 'string' ? srv.nome : '',
              descricao: undefined,
              duracao_minutos: Number((srv.duracaoMinutos as number | undefined) ?? 30),
              preco_base: Number((srv.precoBase as string | number | undefined) ?? 0),
              ativo: true,
              created_at: new Date(),
              updated_at: new Date(),
            } : undefined,
            barbeiro: barb ? {
              id: typeof barb.id === 'string' ? barb.id : '',
              clerk_user_id: '',
              nome: typeof barb.nome === 'string' ? barb.nome : '',
              email: typeof barb.email === 'string' ? barb.email : '',
              telefone: typeof barb.telefone === 'string' ? barb.telefone : '',
              tipo: 'barbeiro',
              created_at: new Date(),
              updated_at: new Date(),
            } : undefined,
          }
        })
        setAgendamentos(mapped)
      } catch {}
    })()
  }, [])

  const proximosAgendamentos = agendamentos.filter(
    (a) => a.data_hora > new Date() && a.status !== "cancelado"
  ).sort((a, b) => a.data_hora.getTime() - b.data_hora.getTime())

  const historicoAgendamentos = agendamentos.filter(
    (a) => a.data_hora <= new Date() || a.status === "cancelado"
  ).sort((a, b) => b.data_hora.getTime() - a.data_hora.getTime())

  const handleCancelarAgendamento = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento)
    setModalCancelarOpen(true)
  }

  const handlePagarAgendamento = (agendamento: Agendamento) => {
    setAgendamentoSelecionado(agendamento)
    setModalPagamentoOpen(true)
  }


  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between py-3">
          <Logo text="Cortaqui" />
          {isMobile ? (
            <div className="flex items-center gap-3">
              <ClerkAuthButtons />
              <MobileNavSheet
                items={[
                  { title: "Agendar", url: "/agendar" },
                  { title: "Meus Agendamentos", url: "/meus-agendamentos" },
                ]}
              />
            </div>
          ) : (
            <nav className="flex items-center gap-4">
              <a href="/agendar" className="text-sm hover:underline">Agendar</a>
              <a href="/meus-agendamentos" className="text-sm hover:underline">Meus Agendamentos</a>
              <ClerkAuthButtons />
            </nav>
          )}
        </div>
      </header>
      {/* Page header removed per spec */}

      <Tabs defaultValue="proximos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proximos">
            Próximos Agendamentos ({proximosAgendamentos.length})
          </TabsTrigger>
          <TabsTrigger value="historico">
            Histórico ({historicoAgendamentos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proximos" className="space-y-4">
          {proximosAgendamentos.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Você não tem agendamentos próximos</p>
                <Button className="mt-4" asChild>
                  <a href="/agendar">Agendar Novo Serviço</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            proximosAgendamentos.map((agendamento) => (
              <AgendamentoCard
                key={agendamento.id}
                agendamento={agendamento}
                showActions={true}
                onCancel={handleCancelarAgendamento}
                onPay={handlePagarAgendamento}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          {historicoAgendamentos.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Você ainda não tem histórico de agendamentos</p>
              </CardContent>
            </Card>
          ) : (
            historicoAgendamentos.map((agendamento) => (
              <AgendamentoCard
                key={agendamento.id}
                agendamento={agendamento}
                showActions={agendamento.status === "concluido"}
                onPay={handlePagarAgendamento}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <ModalCancelarAgendamento
        open={modalCancelarOpen}
        onOpenChange={setModalCancelarOpen}
        agendamento={agendamentoSelecionado}
        onAgendamentoCancelado={async () => {
          try {
            const id = agendamentoSelecionado?.id
            if (!id) return
            const res = await fetch(`/api/cliente/agendamentos/${id}/cancelar`, { method: 'POST' })
            if (!res.ok) {
              console.error('Falha ao cancelar agendamento', await res.text())
            }
            setAgendamentos((prev) => prev.map((a) => a.id === id ? { ...a, status: 'cancelado' } : a))
          } finally {
            setModalCancelarOpen(false)
            setAgendamentoSelecionado(null)
          }
        }}
      />

      <ModalPagamento
        open={modalPagamentoOpen}
        onOpenChange={setModalPagamentoOpen}
        agendamento={agendamentoSelecionado}
        onPagamentoRealizado={() => {
          // TODO: Atualizar status do agendamento
          setModalPagamentoOpen(false)
          setAgendamentoSelecionado(null)
        }}
      />
    </div>
  )
}
