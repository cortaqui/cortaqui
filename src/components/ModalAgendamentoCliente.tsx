"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Calendar } from "~/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { getClientes, getServicosAtivos, getBarbeiros } from "~/lib/mock-data"
import type { Usuario, Servico, Agendamento } from "~/lib/types"
import { User, Plus, Scissors, Clock, DollarSign } from "lucide-react"

interface ModalAgendamentoClienteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgendamentoCriado: (agendamento: Agendamento) => void
}

export function ModalAgendamentoCliente({ open, onOpenChange, onAgendamentoCriado }: ModalAgendamentoClienteProps) {
  const [etapa, setEtapa] = useState<"cliente" | "servico" | "agendamento">("cliente")
  const [clienteSelecionado, setClienteSelecionado] = useState<Usuario | null>(null)
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null)
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState<string>("any")
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(new Date())
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>("")
  const [loading, setLoading] = useState(false)

  // Dados para novo cliente
  const [nomeNovoCliente, setNomeNovoCliente] = useState("")
  const [telefoneNovoCliente, setTelefoneNovoCliente] = useState("")
  const [emailNovoCliente, setEmailNovoCliente] = useState("")

  const [clientes] = useState<Usuario[]>(getClientes())
  const [servicos] = useState<Servico[]>(getServicosAtivos())
  const [barbeiros] = useState<Usuario[]>(getBarbeiros())

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

  const handleSelecionarCliente = (cliente: Usuario) => {
    setClienteSelecionado(cliente)
    setEtapa("servico")
  }

  const handleCriarNovoCliente = async () => {
    if (!nomeNovoCliente || !telefoneNovoCliente) return

    setLoading(true)

    // TODO: Enviar para /api/admin/clientes
    const novoCliente: Usuario = {
      id: Math.random().toString(36).substr(2, 9),
      clerk_user_id: `clerk_cliente_${Math.random().toString(36).substr(2, 9)}`,
      nome: nomeNovoCliente,
      email: emailNovoCliente,
      telefone: telefoneNovoCliente,
      tipo: "cliente",
      created_at: new Date(),
      updated_at: new Date(),
    }

    setClienteSelecionado(novoCliente)
    setEtapa("servico")
    setLoading(false)
  }

  const handleSelecionarServico = (servico: Servico) => {
    setServicoSelecionado(servico)
    setEtapa("agendamento")
  }

  const handleConfirmarAgendamento = async () => {
    if (!clienteSelecionado || !servicoSelecionado || !dataSelecionada || !horarioSelecionado) return

    setLoading(true)

    // TODO: Enviar para /api/agendamentos
    const novoAgendamento: Agendamento = {
      id: Math.random().toString(36).substr(2, 9),
      cliente_user_id: clienteSelecionado.id,
      barbeiro_user_id: barbeiroSelecionado === "any" ? barbeiros[0].id : barbeiroSelecionado,
      servico_id: servicoSelecionado.id,
      data_hora: new Date(`${dataSelecionada.toDateString()} ${horarioSelecionado}`),
      status: "agendado",
      preco_final: servicoSelecionado.preco_base,
      created_at: new Date(),
      updated_at: new Date(),
      cliente: clienteSelecionado,
      barbeiro: barbeiroSelecionado === "any" ? barbeiros[0] : barbeiros.find((b) => b.id === barbeiroSelecionado),
      servico: servicoSelecionado,
    }

    onAgendamentoCriado(novoAgendamento)
    handleFecharModal()
    setLoading(false)
  }

  const handleFecharModal = () => {
    setEtapa("cliente")
    setClienteSelecionado(null)
    setServicoSelecionado(null)
    setBarbeiroSelecionado("any")
    setDataSelecionada(new Date())
    setHorarioSelecionado("")
    setNomeNovoCliente("")
    setTelefoneNovoCliente("")
    setEmailNovoCliente("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleFecharModal}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar para Cliente</DialogTitle>
          <DialogDescription>
            {etapa === "cliente" && "Selecione um cliente existente ou crie um novo"}
            {etapa === "servico" && "Escolha o serviço desejado"}
            {etapa === "agendamento" && "Defina o barbeiro, data e horário"}
          </DialogDescription>
        </DialogHeader>

        {etapa === "cliente" && (
          <Tabs defaultValue="existente" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existente">Cliente Existente</TabsTrigger>
              <TabsTrigger value="novo">Novo Cliente</TabsTrigger>
            </TabsList>

            <TabsContent value="existente" className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {clientes.map((cliente) => (
                  <Card
                    key={cliente.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelecionarCliente(cliente)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="novo" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={nomeNovoCliente}
                    onChange={(e) => setNomeNovoCliente(e.target.value)}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefoneNovoCliente}
                    onChange={(e) => setTelefoneNovoCliente(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailNovoCliente}
                    onChange={(e) => setEmailNovoCliente(e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <Button onClick={handleCriarNovoCliente} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? "Criando..." : "Criar Cliente"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {etapa === "servico" && (
          <div className="space-y-4">
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {servicos.map((servico) => (
                <Card
                  key={servico.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelecionarServico(servico)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Scissors className="h-5 w-5" />
                        <div>
                          <h3 className="font-semibold">{servico.nome}</h3>
                          {servico.descricao && <p className="text-sm text-muted-foreground">{servico.descricao}</p>}
                        </div>
                      </div>
                      <div className="text-right">
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" onClick={() => setEtapa("cliente")}>
              Voltar
            </Button>
          </div>
        )}

        {etapa === "agendamento" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Cliente:</strong> {clienteSelecionado?.nome}
                </p>
                <p>
                  <strong>Serviço:</strong> {servicoSelecionado?.nome}
                </p>
                <p>
                  <strong>Duração:</strong> {servicoSelecionado?.duracao_minutos} min
                </p>
                <p>
                  <strong>Valor:</strong> R${" "}
                  {servicoSelecionado?.preco_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="barbeiro">Barbeiro (Opcional)</Label>
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
              </div>

              <div className="grid gap-2">
                <Label>Data</Label>
                <Calendar
                  mode="single"
                  selected={dataSelecionada}
                  onSelect={setDataSelecionada}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-md border"
                />
              </div>

              {dataSelecionada && (
                <div className="grid gap-2">
                  <Label>Horários Disponíveis</Label>
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
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEtapa("servico")}>
                Voltar
              </Button>
              <Button onClick={handleConfirmarAgendamento} disabled={!horarioSelecionado || loading} className="flex-1">
                {loading ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
