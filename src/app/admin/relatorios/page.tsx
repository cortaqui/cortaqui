"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { AgendamentoChart } from "~/components/AgendamentoChart"
import { FaturamentoChart } from "~/components/FaturamentoChart"
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart"

export default function RelatoriosPage() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState("ultimo_mes")
  const [faturamentoTotal, setFaturamentoTotal] = useState(0)
  const [totalAgendamentos, setTotalAgendamentos] = useState(0)
  const [totalClientes, setTotalClientes] = useState(0)
  const [totalServicos, setTotalServicos] = useState(0)
  const [agPorDiaSemana, setAgPorDiaSemana] = useState<Array<{ dia: string; agendamentos: number }>>([])
  const [range, setRange] = useState<{ start: Date; end: Date }>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    return { start, end: now }
  })

  // Buscar dados reais de APIs, atualizando conforme o range
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [agRes, cliRes, servRes] = await Promise.all<unknown>([
          fetch("/api/agendamentos").then((r) => (r.ok ? r.json() : Promise.resolve([]))),
          fetch("/api/admin/clientes").then((r) => (r.status === 200 ? r.json() : Promise.resolve([]))),
          fetch("/api/admin/servicos").then((r) => (r.status === 200 ? r.json() : Promise.resolve([]))),
        ])
        const ag = (Array.isArray(agRes) ? agRes : []) as Array<{ dataHoraInicio?: string; data_hora?: string; valorCobrado?: string; status?: string }>
        const inRange = (iso?: string) => {
          if (!iso) return false
          const d = new Date(iso)
          return d >= range.start && d <= range.end
        }
        const agFiltered = ag.filter((a) => inRange(a.dataHoraInicio ?? a.data_hora))
        setTotalAgendamentos(agFiltered.length)
        setTotalClientes(Array.isArray(cliRes) ? (cliRes as unknown[]).length : 0)
        setTotalServicos(Array.isArray(servRes) ? (servRes as unknown[]).length : 0)
        const fat = agFiltered.reduce((acc, a) => acc + (a.status === 'CONCLUIDO' && a.valorCobrado ? Number(a.valorCobrado) : 0), 0)
        setFaturamentoTotal(fat)

        // Agendamentos por dia da semana
        const labelForIndex = (i: number): string => {
          switch (i) {
            case 0: return "Dom"
            case 1: return "Seg"
            case 2: return "Ter"
            case 3: return "Qua"
            case 4: return "Qui"
            case 5: return "Sex"
            case 6: return "Sáb"
            default: return ""
          }
        }
        const counts = new Array(7).fill(0) as number[]
        for (const a of agFiltered) {
          const iso = a.dataHoraInicio ?? a.data_hora
          if (!iso) continue
          const d = new Date(iso)
          const idx = d.getDay()
          counts[idx] = (counts[idx] ?? 0) + 1
        }
        setAgPorDiaSemana(counts.map((c, i) => ({ dia: labelForIndex(i), agendamentos: c })))
      } catch {}
    }
    void fetchAll()
  }, [range])

  const options = [
    { value: "ultima_semana", label: "Última semana" },
    { value: "ultimo_mes", label: "Último mês" },
    { value: "ultimo_semestre", label: "Último semestre" },
    { value: "ytd", label: "YTD" },
    { value: "todo_periodo", label: "Todo o período" },
  ]

  useEffect(() => {
    const now = new Date()
    let start = new Date(now)
    if (periodoSelecionado === "ultima_semana") {
      start = new Date(now)
      start.setDate(start.getDate() - 7)
    } else if (periodoSelecionado === "ultimo_mes") {
      start = new Date(now)
      start.setMonth(start.getMonth() - 1)
    } else if (periodoSelecionado === "ultimo_semestre") {
      start = new Date(now)
      start.setMonth(start.getMonth() - 6)
    } else if (periodoSelecionado === "ytd") {
      start = new Date(now.getFullYear(), 0, 1)
    } else if (periodoSelecionado === "todo_periodo") {
      start = new Date(2025, 8, 1) // 01/09/2025
    }
    setRange({ start, end: now })
  }, [periodoSelecionado])

  const chartConfigBar = {
    agendamentos: {
      label: "Agendamentos",
      color: "var(--primary)",
    },
  }

//   const chartConfigPie = {
//     quantidade: {
//       label: "Quantidade",
//       color: "var(--primary)",
//     },
//   }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada do desempenho da barbearia</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="faturamento">Faturamento</TabsTrigger>
          {/* <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="barbeiros">Barbeiros</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger> */}
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {faturamentoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAgendamentos}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClientes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServicos}</div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 md:grid-cols-2">
                <AgendamentoChart range={range} hideSelectors />

            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigBar} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agPorDiaSemana}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dia" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="agendamentos" fill="var(--color-agendamentos)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faturamento" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Faturamento</CardTitle>
                <CardDescription>Faturamento agregado no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <FaturamentoChart range={range} hideSelectors />
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>Faturamento por Barbeiro</CardTitle>
                <CardDescription>Performance individual dos barbeiros</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {relatorio.barbeiros_performance.map((barbeiro, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{barbeiro.nome}</p>
                        <p className="text-sm text-muted-foreground">{barbeiro.agendamentos} agendamentos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R$ {barbeiro.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {((barbeiro.faturamento / relatorio.faturamento_total) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </div>
        </TabsContent>

        {/* <TabsContent value="servicos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Serviços Mais Populares</CardTitle>
                <CardDescription>Ranking dos serviços mais solicitados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {relatorio.servicos_mais_populares.map((servico, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}º</Badge>
                        <div>
                          <p className="font-medium">{servico.nome}</p>
                          <p className="text-sm text-muted-foreground">{servico.quantidade} vezes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R$ {servico.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {((servico.faturamento / relatorio.faturamento_total) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Serviços</CardTitle>
                <CardDescription>Proporção de cada serviço</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigPie} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={relatorio.servicos_mais_populares}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nome, percent = 0 }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {relatorio.servicos_mais_populares.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="barbeiros" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance dos Barbeiros</CardTitle>
                <CardDescription>Comparativo de agendamentos e faturamento</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigBar} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={relatorio.barbeiros_performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="agendamentos" fill="var(--color-agendamentos)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Barbeiro</CardTitle>
                <CardDescription>Estatísticas individuais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {relatorio.barbeiros_performance.map((barbeiro, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{barbeiro.nome}</h4>
                        <Badge variant="outline">
                          {((barbeiro.agendamentos / relatorio.total_agendamentos) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Agendamentos</p>
                          <p className="font-medium">{barbeiro.agendamentos}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Faturamento</p>
                          <p className="font-medium">
                            R$ {barbeiro.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ticket Médio</p>
                          <p className="font-medium">
                            R${" "}
                            {(barbeiro.faturamento / barbeiro.agendamentos).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Horários de Pico</CardTitle>
                <CardDescription>Horários com mais agendamentos</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfigBar} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={relatorio.horarios_pico}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="horario" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="agendamentos" fill="var(--color-agendamentos)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise de Clientes</CardTitle>
                <CardDescription>Estatísticas da base de clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{relatorio.total_clientes}</div>
                      <div className="text-sm text-muted-foreground">Total de Clientes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {(relatorio.total_agendamentos / relatorio.total_clientes).toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Agendamentos por Cliente</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Horários Mais Procurados</h4>
                    {relatorio.horarios_pico.slice(0, 3).map((horario, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{horario.horario}</span>
                        </div>
                        <Badge variant="outline">{horario.agendamentos} agendamentos</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent> */}
      </Tabs>
    </div>
  )
}
