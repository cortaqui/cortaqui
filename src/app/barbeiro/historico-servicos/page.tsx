"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { getAgendamentosByBarbeiro } from "~/lib/mock-data"
import type { Agendamento } from "~/lib/types"
import { Search, Filter, Calendar, DollarSign } from "lucide-react"

export default function HistoricoServicosPage() {
  // TODO: Pegar ID do barbeiro logado via Clerk
  const barbeiroId = "2" // Mock - Carlos Santos
  const [agendamentos] = useState<Agendamento[]>(getAgendamentosByBarbeiro(barbeiroId))
  const [pesquisa, setPesquisa] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroServico, setFiltroServico] = useState("todos")
  const [filtroMes, setFiltroMes] = useState("todos")

  // TODO: Buscar dados de /api/barbeiro/historico

  const servicosConcluidos = agendamentos.filter((a) => a.status === "concluido")

  // Aplicar filtros
  const agendamentosFiltrados = servicosConcluidos
    .filter((agendamento) => {
      const matchPesquisa =
        agendamento.cliente?.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        agendamento.servico?.nome.toLowerCase().includes(pesquisa.toLowerCase())

      const matchStatus = filtroStatus === "todos" || agendamento.status === filtroStatus

      const matchServico = filtroServico === "todos" || agendamento.servico?.nome === filtroServico

      const matchMes = filtroMes === "todos" || agendamento.data_hora.getMonth() === Number.parseInt(filtroMes)

      return matchPesquisa && matchStatus && matchServico && matchMes
    })
    .sort((a, b) => b.data_hora.getTime() - a.data_hora.getTime())

  const totalFaturamento = agendamentosFiltrados.reduce((total, agendamento) => total + agendamento.preco_final, 0)

  const servicosUnicos = [...new Set(agendamentos.map((a) => a.servico?.nome).filter(Boolean))]

  const meses = [
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" },
  ]

  const limparFiltros = () => {
    setPesquisa("")
    setFiltroStatus("todos")
    setFiltroServico("todos")
    setFiltroMes("todos")
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Serviços</h1>
        <p className="text-muted-foreground">Visualize e pesquise todos os serviços realizados</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendamentosFiltrados.length}</div>
            <p className="text-xs text-muted-foreground">
              {agendamentosFiltrados.length !== servicosConcluidos.length && `de ${servicosConcluidos.length} total`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {agendamentosFiltrados.length !== servicosConcluidos.length && "Filtrado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {agendamentosFiltrados.length > 0
                ? (totalFaturamento / agendamentosFiltrados.length).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })
                : "0,00"}
            </div>
            <p className="text-xs text-muted-foreground">Valor médio por serviço</p>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="grid gap-2">
              <Label htmlFor="pesquisa">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pesquisa"
                  placeholder="Cliente ou serviço..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="servico">Serviço</Label>
              <Select value={filtroServico} onValueChange={setFiltroServico}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os serviços</SelectItem>
                  {servicosUnicos.map((servico) => (
                    <SelectItem key={servico} value={servico!}>
                      {servico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mes">Mês</Label>
              <Select value={filtroMes} onValueChange={setFiltroMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os meses</SelectItem>
                  {meses.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
