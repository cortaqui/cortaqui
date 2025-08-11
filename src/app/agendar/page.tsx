"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Calendar } from "~/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Scissors, Clock, DollarSign, User, CalendarDays } from "lucide-react"
import { getServicosAtivos, getBarbeiros } from "~/lib/mock-data"
import type { Servico, Usuario } from "~/lib/types"

export default function AgendarPage() {
  const [servicos] = useState<Servico[]>(getServicosAtivos())
  const [barbeiros] = useState<Usuario[]>(getBarbeiros())
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null)
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState<string>("any")
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(new Date())
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>("")

  // TODO: Buscar dados de /api/servicos e /api/disponibilidade

  const horariosDisponiveis = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ]

  const handleSelecionarServico = (servico: Servico) => {
    setServicoSelecionado(servico)
  }

  const handleConfirmarAgendamento = () => {
    // TODO: Enviar para /api/agendamentos
    console.log("Agendamento:", {
      servico: servicoSelecionado,
      barbeiro: barbeiroSelecionado,
      data: dataSelecionada,
      horario: horarioSelecionado,
    })
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agendar Serviço</h1>
        <p className="text-muted-foreground">Escolha o serviço, barbeiro e horário desejado</p>
      </div>

      {!servicoSelecionado ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Escolha um Serviço</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servicos.map((servico) => (
              <Card
                key={servico.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelecionarServico(servico)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    {servico.nome}
                  </CardTitle>
                  {servico.descricao && <CardDescription>{servico.descricao}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {servico.duracao_minutos} min
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">
                        R$ {servico.preco_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Serviço Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{servicoSelecionado.nome}</h3>
                  <p className="text-sm text-muted-foreground">{servicoSelecionado.duracao_minutos} minutos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    R$ {servicoSelecionado.preco_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setServicoSelecionado(null)}>
                    Alterar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Escolher Barbeiro (Opcional)
                </CardTitle>
                <CardDescription>Deixe em branco para qualquer barbeiro disponível</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={barbeiroSelecionado} onValueChange={setBarbeiroSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer barbeiro disponível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Qualquer barbeiro disponível</SelectItem>
                    {barbeiros.map((barbeiro) => (
                      <SelectItem key={barbeiro.id} value={barbeiro.id}>
                        {barbeiro.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Escolher Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={setDataSelecionada}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>

          {dataSelecionada && (
            <Card>
              <CardHeader>
                <CardTitle>Horários Disponíveis</CardTitle>
                <CardDescription>
                  {dataSelecionada.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {horariosDisponiveis.map((horario) => (
                    <Button
                      key={horario}
                      variant={horarioSelecionado === horario ? "default" : "outline"}
                      size="sm"
                      onClick={() => setHorarioSelecionado(horario)}
                    >
                      {horario}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {horarioSelecionado && (
            <Card>
              <CardHeader>
                <CardTitle>Confirmar Agendamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p>
                    <strong>Serviço:</strong> {servicoSelecionado.nome}
                  </p>
                  <p>
                    <strong>Barbeiro:</strong>{" "}
                    {barbeiroSelecionado
                      ? barbeiros.find((b) => b.id === barbeiroSelecionado)?.nome
                      : "Qualquer barbeiro disponível"}
                  </p>
                  <p>
                    <strong>Data:</strong> {dataSelecionada?.toLocaleDateString("pt-BR")}
                  </p>
                  <p>
                    <strong>Horário:</strong> {horarioSelecionado}
                  </p>
                  <p>
                    <strong>Valor:</strong> R${" "}
                    {servicoSelecionado.preco_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Button onClick={handleConfirmarAgendamento} className="w-full">
                  Confirmar Agendamento
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
