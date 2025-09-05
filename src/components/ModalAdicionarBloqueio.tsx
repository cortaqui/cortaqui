"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
  editando?: Disponibilidade | null
}

export function ModalAdicionarBloqueio({
  open,
  onOpenChange,
  barbeiroId,
  onBloqueioAdicionado,
  editando,
}: ModalAdicionarBloqueioProps) {
  const [dataEspecifica, setDataEspecifica] = useState<Date | undefined>(new Date())
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFim, setHoraFim] = useState("")
  const [tipo, setTipo] = useState<"bloqueio" | "trabalho">("bloqueio")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editando) {
      setDataEspecifica(editando.data_especifica ?? new Date())
      setHoraInicio(editando.hora_inicio)
      setHoraFim(editando.hora_fim)
      setTipo(editando.tipo)
    } else {
      setDataEspecifica(new Date())
      setHoraInicio("")
      setHoraFim("")
      setTipo("bloqueio")
    }
  }, [editando, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataEspecifica) return

    setLoading(true)

    const novoBloqueio: Disponibilidade = {
      id: Math.random().toString(36).substr(2, 9),
      barbeiro_user_id: barbeiroId,
      dia_semana: dataEspecifica.getDay(),
      hora_inicio: horaInicio,
      hora_fim: horaFim,
      tipo,
      data_especifica: dataEspecifica,
      recorrente: false,
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
                <Input id="inicio" type="time" step={1800} value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fim">Hora Fim</Label>
                <Input id="fim" type="time" step={1800} value={horaFim} onChange={(e) => setHoraFim(e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <Button type="button" variant={tipo === 'bloqueio' ? 'default' : 'outline'} onClick={() => setTipo('bloqueio')}>Bloqueio</Button>
                <Button type="button" variant={tipo === 'trabalho' ? 'default' : 'outline'} onClick={() => setTipo('trabalho')}>Trabalho</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (editando ? "Salvar" : "Adicionar Bloqueio")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
