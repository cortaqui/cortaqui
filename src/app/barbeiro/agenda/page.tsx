"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Calendar } from "~/components/ui/calendar"
import { CalendarIcon, Clock, User, ChevronLeft, ChevronRight } from "lucide-react"
import { getAgendamentosByBarbeiro } from "~/lib/mock-data"
import type { Agendamento } from "~/lib/types"

export default function AgendaBarbeiroPage() {
  // TODO: Pegar ID do barbeiro logado via Clerk
  const barbeiroId = "2" // Mock - Carlos Santos
  const [agendamentos] = useState<Agendamento[]>(getAgendamentosByBarbeiro(barbeiroId))
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date())

  // TODO: Buscar dados de /api/barbeiro/agenda

  const agendamentosHoje = agendamentos.filter((a) => a.data_hora.toDateString() === new Date().toDateString())

  const agendamentosDia = agendamentos.filter((a) => a.data_hora.toDateString() === dataSelecionada.toDateString())

  const proximosAgendamentos = agendamentos
    .filter((a) => a.data_hora > new Date())
    .sort((a, b) => a.data_hora.getTime() - b.data_hora.getTime())

  // Gerar agenda semanal
  const getAgendaSemana = () => {
    const inicioSemana = new Date(dataSelecionada)
    inicioSemana.setDate(dataSelecionada.getDate() - dataSelecionada.getDay())

    const diasSemana = []
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana)
      dia.setDate(inicioSemana.getDate() + i)

      const agendamentosDia = agendamentos.filter((a) => a.data_hora.toDateString() === dia.toDateString())

      diasSemana.push({
        data: dia,
        agendamentos: agendamentosDia,
      })
    }

    return diasSemana
  }

  const agendaSemana = getAgendaSemana()

  const navegarSemana = (direcao: "anterior" | "proxima") => {
    const novaData = new Date(dataSelecionada)
    novaData.setDate(dataSelecionada.getDate() + (direcao === "proxima" ? 7 : -7))
    setDataSelecionada(novaData)
  }

  const AgendamentoCard = ({ agendamento }: { agendamento: Agendamento }) => (
    <Card className="mb-2">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{agendamento.cliente?.nome}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {agendamento.data_hora.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span>•</span>
              <span>{agendamento.servico?.nome}</span>
            </div>
          </div>
          <Badge
            variant={
              agendamento.status === "concluido"
                ? "default"
                : agendamento.status === "em_andamento"
                  ? "secondary"
                  : "outline"
            }
          >
            {agendamento.status === "agendado" && "Agendado"}
            {agendamento.status === "confirmado" && "Confirmado"}
            {agendamento.status === "em_andamento" && "Em Andamento"}
            {agendamento.status === "concluido" && "Concluído"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minha Agenda</h1>
        <p className="text-muted-foreground">Visualize seus agendamentos e horários</p>
      </div>

      <Tabs defaultValue="hoje" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="dia">Dia</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="proximos">Próximos</TabsTrigger>
        </TabsList>

        <TabsContent value="hoje" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Agendamentos de Hoje
              </CardTitle>
              <CardDescription>
                {agendamentosHoje.length} agendamento(s) para {new Date().toLocaleDateString("pt-BR")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agendamentosHoje.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum agendamento para hoje</p>
              ) : (
                <div className="space-y-2">
                  {agendamentosHoje.map((agendamento) => (
                    <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dia" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Data</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={(date) => date && setDataSelecionada(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agendamentos - {dataSelecionada.toLocaleDateString("pt-BR")}</CardTitle>
                <CardDescription>{agendamentosDia.length} agendamento(s) para este dia</CardDescription>
              </CardHeader>
              <CardContent>
                {agendamentosDia.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum agendamento para esta data</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {agendamentosDia.map((agendamento) => (
                      <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="semana" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Agenda Semanal</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navegarSemana("anterior")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-normal">
                    {agendaSemana[0]?.data.toLocaleDateString("pt-BR")} -{" "}
                    {agendaSemana[6]?.data.toLocaleDateString("pt-BR")}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => navegarSemana("proxima")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {agendaSemana.map((dia, index) => (
                  <div key={index} className="space-y-2">
                    <div className="text-center">
                      <div className="font-semibold">{dia.data.toLocaleDateString("pt-BR", { weekday: "short" })}</div>
                      <div className="text-sm text-muted-foreground">{dia.data.getDate()}</div>
                    </div>
                    <div className="space-y-1">
                      {dia.agendamentos.length === 0 ? (
                        <div className="text-xs text-muted-foreground text-center py-2">Livre</div>
                      ) : (
                        dia.agendamentos.map((agendamento) => (
                          <div key={agendamento.id} className="bg-primary/10 p-2 rounded text-xs">
                            <div className="font-medium">
                              {agendamento.data_hora.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-muted-foreground">{agendamento.cliente?.nome}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proximos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Agendamentos</CardTitle>
              <CardDescription>Seus próximos {proximosAgendamentos.length} agendamentos</CardDescription>
            </CardHeader>
            <CardContent>
              {proximosAgendamentos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum agendamento futuro</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {proximosAgendamentos.slice(0, 10).map((agendamento) => (
                    <Card key={agendamento.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{agendamento.cliente?.nome}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {agendamento.data_hora.toLocaleDateString("pt-BR")} às{" "}
                              {agendamento.data_hora.toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-sm text-muted-foreground">{agendamento.servico?.nome}</div>
                          </div>
                          <Badge variant="outline">
                            R$ {agendamento.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
