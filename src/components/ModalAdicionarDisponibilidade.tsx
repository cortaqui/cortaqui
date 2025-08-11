"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import type { Disponibilidade } from "~/lib/types"

interface ModalAdicionarDisponibilidadeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  barbeiroId: string
  onDisponibilidadeAdicionada: (disponibilidade: Disponibilidade) => void
}

export function ModalAdicionarDisponibilidade({
  open,
  onOpenChange,
  barbeiroId,
  onDisponibilidadeAdicionada,
}: ModalAdicionarDisponibilidadeProps) {
  const [diaSemana, setDiaSemana] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFim, setHoraFim] = useState("")
  const [loading, setLoading] = useState(false)

  const diasSemana = [
    { value: "0", label: "Domingo" },
    { value: "1", label: "Segunda-feira" },
    { value: "2", label: "Terça-feira" },
    { value: "3", label: "Quarta-feira" },
    { value: "4", label: "Quinta-feira" },
    { value: "5", label: "Sexta-feira" },
    { value: "6", label: "Sábado" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Enviar para /api/admin/disponibilidade
    const novaDisponibilidade: Disponibilidade = {
      id: Math.random().toString(36).substr(2, 9),
      barbeiro_user_id: barbeiroId,
      dia_semana: Number.parseInt(diaSemana),
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      tipo: "trabalho",
      created_at: new Date(),
      updated_at: new Date(),
    }

    onDisponibilidadeAdicionada(novaDisponibilidade)

    // Limpar formulário
    setDiaSemana("")
    setHoraInicio("")
    setHoraFim("")
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Horário de Trabalho</DialogTitle>
          <DialogDescription>Defina um novo horário de trabalho para o barbeiro</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dia">Dia da Semana</Label>
              <Select value={diaSemana} onValueChange={setDiaSemana} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  {diasSemana.map((dia) => (
                    <SelectItem key={dia.value} value={dia.value}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inicio">Hora Início</Label>
                <Input
                  id="inicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fim">Hora Fim</Label>
                <Input id="fim" type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} required />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
