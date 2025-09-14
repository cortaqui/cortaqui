"use client"

import { useMemo, useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import type { Disponibilidade } from "~/lib/types"
import { Clock, Plus, Trash2 } from 'lucide-react'
import { UserAutocomplete, type Suggestion } from "~/components/UserAutocomplete"
import { ModalEditarDisponibilidade } from "~/components/ModalEditarDisponibilidade"
import { ModalAdicionarBloqueio } from "~/components/ModalAdicionarBloqueio"
import { ModalConfirmar } from "~/components/ModalConfirmar"

export default function DisponibilidadePage() {
  const [barbeiroNome, setBarbeiroNome] = useState("")
  const [barbeiroId, setBarbeiroId] = useState<string>("")
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [pendingEdit, setPendingEdit] = useState<{ dia: number; inicio: string; fim: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toDelete, setToDelete] = useState<Disponibilidade | null>(null)

  async function loadDisponibilidade(id: string) {
    if (!id) return
    const res = await fetch(`/api/disponibilidade?barbeiroId=${encodeURIComponent(id)}`)
    if (!res.ok) return
    const rows = await res.json() as Array<{
      id: string
      barbeiro_user_id: string
      tipo: string
      recorrente: boolean
      dia_semana: number | null
      hora_inicio: string
      hora_fim: string
      data_especifica: string | null
    }>
    const mapped: Disponibilidade[] = rows.map(r => ({
      id: r.id,
      barbeiro_user_id: r.barbeiro_user_id,
      dia_semana: (r.dia_semana ?? 0),
      hora_inicio: r.hora_inicio.slice(0,5),
      hora_fim: r.hora_fim.slice(0,5),
      tipo: (r.tipo.toLowerCase() as "trabalho" | "bloqueio"),
      recorrente: Boolean(r.recorrente),
      data_especifica: r.data_especifica ? new Date(r.data_especifica) : undefined,
      created_at: new Date(),
      updated_at: new Date(),
    }))
    setDisponibilidades(mapped)
  }

  const diasSemana = [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Segunda-feira" },
    { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" },
    { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" },
    { value: 6, label: "Sábado" },
  ]

  const disponibilidadesBarbeiro = disponibilidades

  function toMinutes(hhmm: string): number {
    const parts = hhmm.split(":")
    const h = Number(parts[0] ?? 0)
    const m = Number(parts[1] ?? 0)
    return h * 60 + m
  }

  function toHHMM(mins: number): string {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  type Interval = { start: number; end: number }

  function subtractIntervals(base: Interval[], blocks: Interval[]): Interval[] {
    let result: Interval[] = [...base]
    for (const b of blocks) {
      const next: Interval[] = []
      for (const a of result) {
        if (b.end <= a.start || b.start >= a.end) {
          next.push(a)
        } else {
          if (b.start > a.start) next.push({ start: a.start, end: Math.min(b.start, a.end) })
          if (b.end < a.end) next.push({ start: Math.max(b.end, a.start), end: a.end })
        }
      }
      result = next
    }
    return result
  }

  const recurringByDay = useMemo(() => {
    function mergeIntervals(intervals: Interval[]): Interval[] {
      if (intervals.length === 0) return []
      const sorted = [...intervals].sort((a,b) => a.start - b.start)
      const first = sorted[0]!
      const result: Interval[] = [first]
      for (let i=1;i<sorted.length;i++) {
        const last = result[result.length-1]!
        const cur = sorted[i]!
        if (cur.start <= last.end) {
          last.end = Math.max(last.end, cur.end)
        } else {
          result.push({ start: cur.start, end: cur.end })
        }
      }
      return result
    }
    const map = new Map<number, { trabalho: Interval[]; bloqueio: Interval[] }>()
    for (let d=0; d<=6; d++) map.set(d, { trabalho: [], bloqueio: [] })
    for (const r of disponibilidadesBarbeiro) {
      if (!r.recorrente) continue
      const bucket = map.get(r.dia_semana)!
      const itv = { start: toMinutes(r.hora_inicio), end: toMinutes(r.hora_fim) }
      if (r.tipo === 'trabalho') bucket.trabalho.push(itv)
      else bucket.bloqueio.push(itv)
    }
    for (const obj of map.values()) {
      obj.trabalho = mergeIntervals(obj.trabalho)
      obj.bloqueio = mergeIntervals(obj.bloqueio)
    }
    return map
  }, [disponibilidadesBarbeiro])

  function daySummary(dayValue: number): string {
    const rec = recurringByDay.get(dayValue)!
    const available = subtractIntervals(rec.trabalho, rec.bloqueio)
    if (available.length === 0) return "Não disponível"
    return available.map(i => `${toHHMM(i.start)}-${toHHMM(i.end)}`).join(", ")
  }

  const specificsSorted = useMemo(() => {
    return disponibilidadesBarbeiro
      .filter(d => d.recorrente === false)
      .sort((a,b) => (a.data_especifica?.getTime() ?? 0) - (b.data_especifica?.getTime() ?? 0))
  }, [disponibilidadesBarbeiro])

  const [editingSpecific, setEditingSpecific] = useState<Disponibilidade | null>(null)

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
          <div className="w-full max-w-md">
            <UserAutocomplete
              value={barbeiroNome}
              onChange={(v) => setBarbeiroNome(v)}
              onSelect={async (s: Suggestion) => {
                setBarbeiroNome(s.name)
                try {
                  const resp = await fetch(`/api/usuarios?email=${encodeURIComponent(s.email ?? "")}`)
                  if (!resp.ok) return
                  const user = await resp.json() as { userId: string }
                  setBarbeiroId(user.userId)
                  await loadDisponibilidade(user.userId)
                } catch {}
              }}
              searchApi="/api/admin/barbeiros/search"
              placeholder="Digite o nome do barbeiro"
            />
          </div>
        </CardContent>
      </Card>

      {barbeiroId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horários de {barbeiroNome}
            </CardTitle>
            <CardDescription>
              Configure os dias e horários de trabalho
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diasSemana.map((dia) => {
                const rec = recurringByDay.get(dia.value)!
                const summary = daySummary(dia.value)
                const defaultInicio = rec.trabalho[0]?.start ? toHHMM(rec.trabalho[0].start) : "09:00"
                const defaultFim = rec.trabalho[0]?.end ? toHHMM(rec.trabalho[0].end) : "18:00"
                return (
                  <div key={dia.value} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-medium w-32">{dia.label}</span>
                      <Badge variant={summary === 'Não disponível' ? 'secondary' : 'default'}>
                        {summary}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      setPendingEdit({ dia: dia.value, inicio: defaultInicio, fim: defaultFim })
                      setEditOpen(true)
                    }}>
                      Editar
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-6 border-t space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Bloqueios Específicos</h3>
                <Button onClick={() => { setEditingSpecific(null); setBlockOpen(true) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Bloqueio Específico
                </Button>
              </div>
              <div className="space-y-2">
                {specificsSorted.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum bloqueio específico cadastrado.</p>
                )}
                {specificsSorted.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded border p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={s.tipo === 'bloqueio' ? 'destructive' : 'default'}>
                        {s.tipo.toUpperCase()}
                      </Badge>
                      <span>
                        {s.data_especifica?.toLocaleDateString("pt-BR")} — {s.hora_inicio} - {s.hora_fim}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingSpecific(s); setBlockOpen(true) }}>Editar</Button>
                      <Button variant="destructive" size="icon" aria-label="Excluir" onClick={() => { setToDelete(s); setConfirmOpen(true) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ModalEditarDisponibilidade
        open={editOpen}
        onOpenChange={setEditOpen}
        disponibilidade={pendingEdit ? {
          id: "",
          barbeiro_user_id: barbeiroId,
          dia_semana: pendingEdit.dia,
          hora_inicio: pendingEdit.inicio,
          hora_fim: pendingEdit.fim,
          tipo: "trabalho",
          created_at: new Date(), updated_at: new Date(),
        } : null}
        barbeiroId={barbeiroId}
        onDisponibilidadeEditada={async (_d) => {
          await loadDisponibilidade(barbeiroId)
        }}
      />

      <ModalAdicionarBloqueio
        open={blockOpen}
        onOpenChange={setBlockOpen}
        barbeiroId={barbeiroId}
        editando={editingSpecific}
        onBloqueioAdicionado={async (b) => {
          if (editingSpecific) {
            await fetch(`/api/disponibilidade?id=${encodeURIComponent(editingSpecific.id)}`, { method: 'DELETE' })
          }
          await fetch('/api/disponibilidade', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barbeiroId, data: b.data_especifica?.toISOString(), horaInicio: b.hora_inicio, horaFim: b.hora_fim, tipo: b.tipo.toUpperCase(), recorrente: false })
          })
          await loadDisponibilidade(barbeiroId)
          setEditingSpecific(null)
        }}
      />

      <ModalConfirmar
        open={confirmOpen}
        onOpenChange={(o) => { setConfirmOpen(o); if (!o) setToDelete(null) }}
        titulo="Excluir bloqueio específico"
        descricao="Esta ação não pode ser desfeita. Deseja continuar?"
        loading={deleting}
        onConfirmar={async () => {
          if (!toDelete) return
          setDeleting(true)
          try {
            await fetch(`/api/disponibilidade?id=${encodeURIComponent(toDelete.id)}`, { method: 'DELETE' })
            await loadDisponibilidade(barbeiroId)
          } finally {
            setDeleting(false)
            setConfirmOpen(false)
            setToDelete(null)
          }
        }}
      />
    </div>
  )
}
