"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Badge } from "~/components/ui/badge"
import { Plus, Calendar } from 'lucide-react'
import { mockAgendamentos } from "~/lib/mock-data"
import type { Agendamento } from "~/lib/types"

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(mockAgendamentos)

  // TODO: Buscar dados de /api/agendamentos

  const getStatusBadge = (status: Agendamento["status"]) => {
    const variants = {
      agendado: "default",
      confirmado: "secondary", 
      em_andamento: "default",
      concluido: "default",
      cancelado: "destructive",
    } as const

    const labels = {
      agendado: "Agendado",
      confirmado: "Confirmado",
      em_andamento: "Em Andamento", 
      concluido: "Concluído",
      cancelado: "Cancelado",
    }

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">Visualize e gerencie todos os agendamentos</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agendar para Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Todos os Agendamentos
          </CardTitle>
          <CardDescription>Lista completa de agendamentos do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Barbeiro</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agendamentos.map((agendamento) => (
                <TableRow key={agendamento.id}>
                  <TableCell className="font-medium">
                    {agendamento.cliente?.nome}
                  </TableCell>
                  <TableCell>{agendamento.barbeiro?.nome}</TableCell>
                  <TableCell>{agendamento.servico?.nome}</TableCell>
                  <TableCell>
                    <div>
                      <div>{agendamento.data_hora.toLocaleDateString("pt-BR")}</div>
                      <div className="text-sm text-muted-foreground">
                        {agendamento.data_hora.toLocaleTimeString("pt-BR", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(agendamento.status)}</TableCell>
                  <TableCell>
                    R$ {agendamento.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
