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
import { Calendar } from "~/components/ui/calendar"
import type { Disponibilidade } from "~/lib/types"

interface ModalAdicionarBloqueioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  barbeiroId: string
  onBloqueioAdicionado: (bloqueio: Disponibilidade) => void
}

export function ModalAdicionarBloqueio({
  open,
  onOpenChange,
  barbeiroId,
  onBloqueioAdicionado,
}: ModalAdicionarBloqueioProps) {
  const [dataEspecifica, setDataEspecifica] = useState<Date | undefined>(new Date())
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFim, setHoraFim] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataEspecifica) return

    setLoading(true)

    // TODO: Enviar para /api/admin/disponibilidade
    const novoBloqueio: Disponibilidade = {
      id: Math.random().toString(36).substr(2, 9),
      barbeiro_user_id: barbeiroId,
      dia_semana: dataEspecifica.getDay(),
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      tipo: "bloqueio",
      data_especifica: dataEspecifica,
      created_at: new Date(),
      updated_at: new Date(),
    }

    onBloqueioAdicionado(novoBloqueio)

    // Limpar formulário
    setDataEspecifica(new Date())
    setHoraInicio("")
    setHoraFim("")
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Bloqueio</DialogTitle>
          <DialogDescription>Bloqueie um horário específico para o barbeiro</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Data Específica</Label>
              <Calendar
                mode="single"
                selected={dataEspecifica}
                onSelect={setDataEspecifica}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
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
              {loading ? "Salvando..." : "Adicionar Bloqueio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
