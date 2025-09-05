"use client"

import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Calendar } from "~/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import type { Agendamento } from "~/lib/types"
import { computeDailyWorkIntervals, generateAvailableSlots, type DisponibilidadeItem } from "~/lib/agendamento-utils"

interface ModalEditarAgendamentoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento | null
  onAgendamentoAtualizado: (agendamento: Agendamento) => void
}

export function ModalEditarAgendamento({ open, onOpenChange, agendamento, onAgendamentoAtualizado }: ModalEditarAgendamentoProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [slots, setSlots] = useState<Date[]>([])
  const [slotSel, setSlotSel] = useState<Date | null>(null)
  const [status, setStatus] = useState<Agendamento["status"]>("confirmado")
  const [dispon, setDispon] = useState<DisponibilidadeItem[]>([])
  const [bookings, setBookings] = useState<{ inicio: Date; fim: Date }[]>([])
  const [loading, setLoading] = useState(false)

  const duracaoMin = agendamento?.servico?.duracao_minutos ?? 30

  useEffect(() => {
    if (!agendamento) return
    setStatus(agendamento.status)
    setDate(new Date(agendamento.data_hora))
    setSlotSel(new Date(agendamento.data_hora))
  }, [agendamento])

  // Fetch disponibilidade and bookings for the selected barbeiro
  useEffect(() => {
    if (!agendamento?.barbeiro_user_id) return
    void (async () => {
      try {
        const res = await fetch(`/api/disponibilidade?barbeiroId=${agendamento.barbeiro_user_id}`)
        if (res.ok) {
          const rows = await res.json() as DisponibilidadeItem[]
          setDispon(rows)
        }
      } catch {}
    })()
    void (async () => {
      try {
        const res = await fetch(`/api/agendamentos`, { cache: "no-store" })
        if (res.ok) {
          const rows = (await res.json()) as Array<Record<string, unknown>>
          const filtered = rows.filter((r) => String(r.fkBarbeiroId ?? r.barbeiro_user_id) === agendamento.barbeiro_user_id && String(r.agendamentoId ?? r.id) !== agendamento.id)
          setBookings(filtered.map((r) => {
            const start = new Date(String(r.dataHoraInicio ?? r.data_hora))
            const endVal = (r.dataHoraFim as string | undefined) ?? undefined
            const end = endVal ? new Date(endVal) : new Date(start.getTime() + (duracaoMin * 60000))
            return { inicio: start, fim: end }
          }))
        }
      } catch {}
    })()
  }, [agendamento?.barbeiro_user_id, duracaoMin, agendamento?.id])

  // Recompute slots when inputs change
  useEffect(() => {
    if (!agendamento?.barbeiro_user_id || !date) { setSlots([]); setSlotSel(null); return }
    const eff = computeDailyWorkIntervals(dispon, agendamento.barbeiro_user_id, date)
    const dayBookings = bookings.filter((b) => b.inicio.getFullYear() === date.getFullYear() && b.inicio.getMonth() === date.getMonth() && b.inicio.getDate() === date.getDate())
    const slotDates = generateAvailableSlots(
      eff,
      dayBookings.map((b) => ({ barbeiroId: agendamento.barbeiro_user_id, inicio: b.inicio, fim: b.fim })),
      date,
      duracaoMin,
      30,
    )
    setSlots(slotDates)
  }, [agendamento?.barbeiro_user_id, date, dispon, bookings, duracaoMin])

  const canSave = !!agendamento && !!slotSel

  async function handleSalvar() {
    if (!agendamento || !slotSel) return
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        dataHoraInicio: slotSel.toISOString(),
        dataHoraFim: new Date(slotSel.getTime() + (duracaoMin * 60000)).toISOString(),
        status: status.toUpperCase(),
      }
      const res = await fetch(`/api/agendamentos/${agendamento.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { console.error("update agendamento falhou", await res.text()); setLoading(false); return }
      const rowUnknown: unknown = await res.json()
      const row = (rowUnknown && typeof rowUnknown === 'object') ? (rowUnknown as Record<string, unknown>) : {}
      const updated: Agendamento = {
        ...agendamento,
        data_hora: new Date(typeof row.dataHoraInicio === 'string' ? row.dataHoraInicio : agendamento.data_hora.toISOString()),
        status,
        updated_at: new Date(),
      }
      onAgendamentoAtualizado(updated)
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>Altere o status e o horário do agendamento</DialogDescription>
        </DialogHeader>

        {agendamento && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Cliente:</strong> {agendamento.cliente?.nome ?? "—"}</div>
                  <div><strong>Barbeiro:</strong> {agendamento.barbeiro?.nome ?? "—"}</div>
                  <div><strong>Serviço:</strong> {agendamento.servico?.nome ?? "—"}</div>
                  <div><strong>Duração:</strong> {agendamento.servico?.duracao_minutos ?? 30} min</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
                <CardContent>
                  <Select value={status} onValueChange={(v) => setStatus(v as Agendamento["status"]) }>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Data</CardTitle></CardHeader>
                <CardContent>
                  <div className="max-w-full overflow-x-auto">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => setDate(d ?? undefined)}
                      disabled={(d) => d < new Date()}
                      className="rounded-md border w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Horários Disponíveis</CardTitle></CardHeader>
                <CardContent>
                  {!agendamento?.barbeiro_user_id || !date ? (
                    <p className="text-sm text-muted-foreground">Selecione uma data.</p>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum horário disponível.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {slots.map((d) => {
                        const label = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        const selected = slotSel?.getTime() === d.getTime()
                        return (
                          <Button key={d.toISOString()} variant={selected ? "default" : "outline"} size="sm" onClick={() => setSlotSel(d)}>
                            {label}
                          </Button>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button className="flex-1" disabled={!canSave || loading} onClick={() => void handleSalvar()}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
