"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Badge } from "~/components/ui/badge"
import { getBarbeiros, mockDisponibilidade } from "~/lib/mock-data"
import type { Usuario, Disponibilidade } from "~/lib/types"
import { Clock, Plus } from 'lucide-react'

export default function DisponibilidadePage() {
  const [barbeiros] = useState<Usuario[]>(getBarbeiros())
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState<string>("")
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>(mockDisponibilidade)

  // TODO: Buscar dados de /api/admin/disponibilidade

  const diasSemana = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda-feira" },
    { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" },
    { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" },
    { value: 6, label: "Sábado" },
  ]

  const disponibilidadesBarbeiro = disponibilidades.filter(
    (d) => d.barbeiro_user_id === barbeiroSelecionado
  )

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disponibilidade</h1>
          <p className="text-muted-foreground">Gerencie os horários de trabalho dos barbeiros</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Barbeiro</CardTitle>
          <CardDescription>Escolha um barbeiro para visualizar e editar sua disponibilidade</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={barbeiroSelecionado} onValueChange={setBarbeiroSelecionado}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Selecione um barbeiro" />
            </SelectTrigger>
            <SelectContent>
              {barbeiros.map((barbeiro) => (
                <SelectItem key={barbeiro.id} value={barbeiro.id}>
                  {barbeiro.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {barbeiroSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários de {barbeiros.find((b) => b.id === barbeiroSelecionado)?.nome}
            </CardTitle>
            <CardDescription>
              Configure os dias e horários de trabalho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diasSemana.map((dia) => {
                const disponibilidadeDia = disponibilidadesBarbeiro.find(
                  (d) => d.dia_semana === dia.value && d.tipo === "trabalho"
                )

                return (
                  <div key={dia.value} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-medium w-32">{dia.label}</span>
                      {disponibilidadeDia ? (
                        <Badge variant="default">
                          {disponibilidadeDia.hora_inicio} - {disponibilidadeDia.hora_fim}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Não disponível</Badge>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      {disponibilidadeDia ? "Editar" : "Adicionar"}
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Bloqueio Específico
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
