"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import type { Agendamento } from "~/lib/types"
import { Filter, Calendar } from "lucide-react"
import { UserAutocomplete } from "~/components/UserAutocomplete"

export default function HistoricoServicosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [clienteQuery, setClienteQuery] = useState("")
  const [servicoQuery, setServicoQuery] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null)
  const [servicoSelecionado, setServicoSelecionado] = useState<string | null>(null)
  const [appliedClienteId, setAppliedClienteId] = useState<string | null>(null)
  const [appliedServicoId, setAppliedServicoId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        console.log('[Historico] fetching agendamentos...')
        const res = await fetch('/api/agendamentos', { cache: 'no-store' })
        if (!res.ok) return
        const rows: unknown = await res.json()
        console.log('[Historico] fetched rows:', rows)
        const mapped: Agendamento[] = Array.isArray(rows) ? rows.map((r) => {
          const anyR = r as Record<string, unknown>
          const fkClienteId = typeof anyR.fkClienteId === 'string' ? anyR.fkClienteId : (typeof anyR.cliente_user_id === 'string' ? anyR.cliente_user_id : '')
          const fkBarbeiroId = typeof anyR.fkBarbeiroId === 'string' ? anyR.fkBarbeiroId : (typeof anyR.barbeiro_user_id === 'string' ? anyR.barbeiro_user_id : '')
          const fkServicoId = typeof anyR.fkServicoId === 'string' ? anyR.fkServicoId : (typeof anyR.servico_id === 'string' ? anyR.servico_id : '')
          const statusRaw = typeof anyR.status === 'string' ? anyR.status.toUpperCase() : 'PENDENTE'
          const toUiStatus = (s: string): Agendamento["status"] => {
            if (s === 'CONFIRMADO') return 'confirmado'
            if (s === 'CONCLUIDO') return 'concluido'
            if (s === 'CANCELADO') return 'cancelado'
            return 'agendado'
          }
          const item: Agendamento = {
            id: String(anyR.agendamentoId ?? anyR.id),
            cliente_user_id: fkClienteId,
            barbeiro_user_id: fkBarbeiroId,
            servico_id: fkServicoId,
            data_hora: new Date((anyR.dataHoraInicio as string) ?? (anyR.data_hora as string)),
            status: toUiStatus(statusRaw),
            preco_final: Number((anyR.valorCobrado as string | number | undefined) ?? (anyR.preco_final as number | undefined) ?? 0),
            observacoes: (anyR.observacoesCliente as string | undefined) ?? (anyR.observacoes as string | undefined),
            created_at: new Date((anyR.dataCadastro as string | undefined) ?? (anyR.created_at as string | undefined) ?? Date.now()),
            updated_at: new Date((anyR.updatedAt as string | undefined) ?? (anyR.updated_at as string | undefined) ?? Date.now()),
          }
          const servJoined = (anyR.servico && typeof anyR.servico === 'object') ? (anyR.servico as Record<string, unknown>) : undefined
          const clienteJoined = (anyR.cliente && typeof anyR.cliente === 'object') ? (anyR.cliente as Record<string, unknown>) : undefined
          if (servJoined) {
            item.servico = {
              id: typeof servJoined.servicoId === 'string' ? servJoined.servicoId : (typeof servJoined.id === 'string' ? servJoined.id : fkServicoId),
              nome: typeof servJoined.nome === 'string' ? servJoined.nome : '',
              duracao_minutos: Number((servJoined.duracaoMinutos as number | undefined) ?? 30),
              preco_base: Number((servJoined.precoBase as string | number | undefined) ?? 0),
              ativo: true,
              created_at: new Date(),
              updated_at: new Date(),
            }
          }
          if (clienteJoined) {
            item.cliente = {
              id: typeof clienteJoined.userId === 'string' ? clienteJoined.userId : fkClienteId,
              clerk_user_id: '',
              nome: typeof clienteJoined.nome === 'string' ? clienteJoined.nome : '',
              email: typeof clienteJoined.email === 'string' ? clienteJoined.email : '',
              telefone: typeof clienteJoined.telefone === 'string' ? clienteJoined.telefone : '',
              tipo: 'cliente',
              created_at: new Date(),
              updated_at: new Date(),
            }
          }
          return item
        }) : []
        console.log('[Historico] mapped agendamentos:', mapped)
        setAgendamentos(mapped)
      } catch {}
    })()
  }, [])

  const totalServicos = agendamentos.length

  const agendamentosFiltrados: Agendamento[] = agendamentos
    .filter((a) => {
      const matchCliente = !appliedClienteId || a.cliente?.id === appliedClienteId
      const matchServico = !appliedServicoId || a.servico?.id === appliedServicoId
      return matchCliente && matchServico
    })
    .sort((a, b) => b.data_hora.getTime() - a.data_hora.getTime())

  // Removed faturamento/ticket metrics

  // const servicosUnicos = [...new Set(agendamentos.map((a) => a.servico?.nome).filter(Boolean))]

  // removed month filter

  const limparFiltros = () => {
    console.log('[Historico] limpar filtros')
    setClienteSelecionado(null)
    setServicoSelecionado(null)
    setClienteQuery("")
    setServicoQuery("")
    setAppliedClienteId(null)
    setAppliedServicoId(null)
  }

  const executarBusca = () => {
    console.log('[Historico] executar busca', {
      clienteSelecionado,
      servicoSelecionado,
    })
    setIsLoading(true)
    setAppliedClienteId(clienteSelecionado)
    setAppliedServicoId(servicoSelecionado)
    setTimeout(() => setIsLoading(false), 0)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços (carregados)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServicos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="grid gap-2">
              <Label>Cliente</Label>
              <UserAutocomplete
                value={clienteQuery}
                onChange={setClienteQuery}
                onSelect={(s) => { setClienteSelecionado(s.id); setClienteQuery(s.name) }}
                searchApi="/api/barbeiro/clientes/search"
                placeholder="Buscar cliente..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Serviço</Label>
              <UserAutocomplete
                value={servicoQuery}
                onChange={setServicoQuery}
                onSelect={(s) => { setServicoSelecionado(s.id); setServicoQuery(s.name) }}
                searchApi="/api/servicos/search"
                placeholder="Buscar serviço..."
              />
            </div>

            <div className="flex items-end">
              <Button variant="default" onClick={executarBusca} disabled={isLoading} className="w-full">Buscar</Button>
            </div>

            {/* Month filter removed */}

            <div className="flex items-end">
              <Button variant="outline" onClick={limparFiltros} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Completo</CardTitle>
          <CardDescription>{agendamentosFiltrados.length} serviço(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}
          {agendamentosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum serviço encontrado com os filtros aplicados</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {agendamentosFiltrados.map((agendamento) => (
                <Card key={agendamento.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{agendamento.cliente?.nome}</span>
                          <Badge variant="default">Concluído</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{agendamento.servico?.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {agendamento.data_hora.toLocaleDateString("pt-BR")} às{" "}
                          {agendamento.data_hora.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          R$ {agendamento.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm text-muted-foreground">{agendamento.servico?.duracao_minutos} min</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
