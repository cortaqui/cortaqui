"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Calendar, Clock, User, Scissors, X, CreditCard } from 'lucide-react'
import { getAgendamentosByCliente } from "~/lib/mock-data"
import type { Agendamento } from "~/lib/types"
import { ModalCancelarAgendamento } from "~/components/ModalCancelarAgendamento"
import { ModalPagamento } from "~/components/ModalPagamento"

export default function MeusAgendamentosPage() {
  // TODO: Pegar ID do cliente logado via Clerk
  const clienteId = "4" // Mock - Maria Costa
  const [agendamentos] = useState<Agendamento[]>(getAgendamentosByCliente(clienteId))
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false)
  const [modalPagamentoOpen, setModalPagamentoOpen] = useState(false)
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<Agendamento | null>(null)

  // TODO: Buscar dados de /api/agendamentos/cliente/[id]

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

  const AgendamentoCard = ({ agendamento, showActions = false }: { agendamento: Agendamento, showActions?: boolean }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              <span className="font-semibold">{agendamento.servico?.nome}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{agendamento.barbeiro?.nome}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{agendamento.data_hora.toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {agendamento.data_hora.toLocaleTimeString("pt-BR", { 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                R$ {agendamento.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <Badge variant={
                agendamento.status === "cancelado" ? "destructive" :
                agendamento.status === "concluido" ? "default" : "secondary"
              }>
                {agendamento.status === "agendado" && "Agendado"}
                {agendamento.status === "confirmado" && "Confirmado"}
                {agendamento.status === "concluido" && "Concluído"}
                {agendamento.status === "cancelado" && "Cancelado"}
              </Badge>
            </div>
          </div>
          {showActions && (
            <div className="flex flex-col gap-2">
              {agendamento.status === "concluido" && (
                <Button 
                  size="sm" 
                  onClick={() => handlePagarAgendamento(agendamento)}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Pagar
                </Button>
              )}
              {(agendamento.status === "agendado" || agendamento.status === "confirmado") && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCancelarAgendamento(agendamento)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meus Agendamentos</h1>
        <p className="text-muted-foreground">Visualize e gerencie seus agendamentos</p>
      </div>

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
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <ModalCancelarAgendamento
        open={modalCancelarOpen}
        onOpenChange={setModalCancelarOpen}
        agendamento={agendamentoSelecionado}
        onAgendamentoCancelado={() => {
          // TODO: Atualizar lista de agendamentos
          setModalCancelarOpen(false)
          setAgendamentoSelecionado(null)
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
