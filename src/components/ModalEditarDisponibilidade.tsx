"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Checkbox } from "~/components/ui/checkbox"

interface ModalEditarDisponibilidadeProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disponibilidade: Disponibilidade | null
  onDisponibilidadeEditada: (disponibilidade: Disponibilidade) => void
  barbeiroId: string
}

export function ModalEditarDisponibilidade({
  open,
  onOpenChange,
  disponibilidade,
  onDisponibilidadeEditada,
  barbeiroId,
}: ModalEditarDisponibilidadeProps) {
  const [diaSemana, setDiaSemana] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFim, setHoraFim] = useState("")
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [blocks, setBlocks] = useState<Array<{ id?: string; inicio: string; fim: string }>>([])

  const diasSemana = [
    { value: "0", label: "Domingo" },
    { value: "1", label: "Segunda-feira" },
    { value: "2", label: "Terça-feira" },
    { value: "3", label: "Quarta-feira" },
    { value: "4", label: "Quinta-feira" },
    { value: "5", label: "Sexta-feira" },
    { value: "6", label: "Sábado" },
  ]

  const [existingRecurringBlockIds, setExistingRecurringBlockIds] = useState<string[]>([])
  const [existingTrabalhoIds, setExistingTrabalhoIds] = useState<string[]>([])

  useEffect(() => {
    if (!disponibilidade || !barbeiroId || !open) return
    setDiaSemana(disponibilidade.dia_semana.toString())
    setHoraInicio(disponibilidade.hora_inicio)
    setHoraFim(disponibilidade.hora_fim)

    void (async () => {
      try {
        const res = await fetch(`/api/disponibilidade?barbeiroId=${encodeURIComponent(barbeiroId)}`)
        if (!res.ok) return
        const rows = (await res.json()) as Array<{ id: string; recorrente: boolean; tipo: string; dia_semana: number | null; hora_inicio: string; hora_fim: string }>
        const day = disponibilidade.dia_semana
        const recurringForDay = rows.filter(r => r.recorrente && r.dia_semana === day)
        const trabalho = recurringForDay.filter(r => r.tipo === 'TRABALHO')
        const bloqueios = recurringForDay.filter(r => r.tipo === 'BLOQUEIO')
        setExistingTrabalhoIds(trabalho.map(t => t.id))
        setExistingRecurringBlockIds(bloqueios.map(b => b.id))
        const firstTrabalho = trabalho[0]
        if (firstTrabalho) {
          setEnabled(true)
          setHoraInicio(firstTrabalho.hora_inicio)
          setHoraFim(firstTrabalho.hora_fim)
        } else {
          setEnabled(false)
        }
        setBlocks(bloqueios.map(b => ({ id: b.id, inicio: b.hora_inicio, fim: b.hora_fim })))
      } catch {}
    })()
  }, [disponibilidade, barbeiroId, open])

  // 30-min steps are enforced via the input's step attribute

  function isValidStep(v: string) {
    if (!/^\d{2}:\d{2}$/.test(v)) return false
    const [hh, mm] = v.split(":")
    const h = Number(hh)
    const m = Number(mm)
    if (!Number.isInteger(h) || !Number.isInteger(m)) return false
    if (h < 0 || h > 23 || m < 0 || m > 59) return false
    return m % 30 === 0
  }

  function hasOverlap(intervals: Array<{inicio: string; fim: string}>): boolean {
    const toMin = (t: string) => Number(t.slice(0,2))*60 + Number(t.slice(3,5))
    const items = intervals.map(i => ({ s: toMin(i.inicio), e: toMin(i.fim) })).sort((a,b)=>a.s-b.s)
    for (let i=1;i<items.length;i++) {
      const prev = items[i-1]
      const cur = items[i]
      if (!prev || !cur) continue
      if (cur.s < prev.e) return true
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disponibilidade) return

    setLoading(true)

    try {
      const day = Number.parseInt(diaSemana)
      // Remove existing recurring blocks (we'll recreate from current state)
      for (const id of existingRecurringBlockIds) {
        await fetch(`/api/disponibilidade?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      }

      if (enabled) {
        // Save base TRABALHO
        await fetch('/api/disponibilidade', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barbeiroId, diaSemana: day, horaInicio, horaFim })
        })

        // Validate and create BLOQUEIO recorrente
        const blockList = blocks.filter(b => b.inicio && b.fim)
        if (blockList.some(b => !isValidStep(b.inicio) || !isValidStep(b.fim))) throw new Error('Horários devem ser em intervalos de 30 minutos')
        if (blockList.some(b => b.fim <= b.inicio)) throw new Error('Hora fim deve ser maior que início')
        if (hasOverlap(blockList)) throw new Error('Bloqueios recorrentes não podem se sobrepor')
        // optional: ensure blocks within base window
        for (const b of blockList) {
          if (!(b.inicio >= horaInicio && b.fim <= horaFim)) throw new Error('Bloqueios devem estar dentro do horário de trabalho')
          await fetch('/api/disponibilidade', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barbeiroId, recorrente: true, diaSemana: day, horaInicio: b.inicio, horaFim: b.fim, tipo: 'BLOQUEIO' })
          })
        }
      } else {
        // Disable: delete TRABALHO if exists and any recurring BLOQUEIO for this day
        for (const id of existingTrabalhoIds) {
          await fetch(`/api/disponibilidade?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
        }
        for (const id of existingRecurringBlockIds) {
          await fetch(`/api/disponibilidade?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
        }
      }

      const disponibilidadeEditada: Disponibilidade = {
        ...disponibilidade,
        dia_semana: Number.parseInt(diaSemana),
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        updated_at: new Date(),
      }
      onDisponibilidadeEditada(disponibilidadeEditada)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      // naive alert to surface validation
      alert((err as Error)?.message ?? 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  if (!disponibilidade) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Horário de Trabalho</DialogTitle>
          <DialogDescription>Altere o horário de trabalho do barbeiro</DialogDescription>
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
            <div className="flex items-center gap-2">
              <Checkbox id="habilitar" checked={enabled} onCheckedChange={(v) => setEnabled(Boolean(v))} />
              <Label htmlFor="habilitar">Habilitar disponibilidade neste dia</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inicio">Hora Início</Label>
                <Input id="inicio" type="time" step={1800} value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required disabled={!enabled} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fim">Hora Fim</Label>
                <Input id="fim" type="time" step={1800} value={horaFim} onChange={(e) => setHoraFim(e.target.value)} required disabled={!enabled} />
              </div>
            </div>
            {enabled && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Bloqueios Recorrentes (ex.: almoço)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setBlocks([...blocks, { inicio: '12:00', fim: '13:00' }])}>Adicionar</Button>
                </div>
                <div className="space-y-2">
                  {blocks.length === 0 && <p className="text-sm text-muted-foreground">Nenhum bloqueio recorrente.</p>}
                  {blocks.map((b, idx) => (
                    <div key={b.id ?? idx} className="grid grid-cols-5 items-end gap-2">
                      <div className="col-span-2">
                        <Label className="text-xs">Início</Label>
                        <Input type="time" step={1800} value={b.inicio} onChange={(e) => {
                          const v = e.target.value
                          setBlocks(prev => prev.map((x,i) => i===idx ? { ...x, inicio: v } : x))
                        }} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Fim</Label>
                        <Input type="time" step={1800} value={b.fim} onChange={(e) => {
                          const v = e.target.value
                          setBlocks(prev => prev.map((x,i) => i===idx ? { ...x, fim: v } : x))
                        }} />
                      </div>
                      <div className="flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => setBlocks(prev => prev.filter((_,i)=>i!==idx))} aria-label="Remover">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
