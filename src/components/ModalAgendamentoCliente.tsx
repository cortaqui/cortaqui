"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Calendar } from "~/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import type { Agendamento } from "~/lib/types"
import { UserAutocomplete, type Suggestion } from "~/components/UserAutocomplete"
import { Clock, DollarSign } from "lucide-react"
import { computeDailyWorkIntervals, generateAvailableSlots, type DisponibilidadeItem } from "~/lib/agendamento-utils"

interface ModalAgendamentoClienteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgendamentoCriado: (agendamento: Agendamento) => void
}

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email)
}

function isValidPhone(phone: string) {
  // allow digits, spaces, (), -; formatted below
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10
}

function formatPhone(input: string) {
  const digits = input.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
}

export function ModalAgendamentoCliente({ open, onOpenChange, onAgendamentoCriado }: ModalAgendamentoClienteProps) {
  // Left column state
  const [clienteQuery, setClienteQuery] = useState("")
  const [clienteSel, setClienteSel] = useState<Suggestion | null>(null)
  const [clienteNome, setClienteNome] = useState("")
  const [clienteEmail, setClienteEmail] = useState("")
  const [clienteTelefone, setClienteTelefone] = useState("")

  const [servicoQuery, setServicoQuery] = useState("")
  const [servicoSel, setServicoSel] = useState<{ id: string; nome: string; duracaoMin?: number; precoBase?: number } | null>(null)

  const [barbeiroQuery, setBarbeiroQuery] = useState("")
  const [barbeiroSel, setBarbeiroSel] = useState<Suggestion | null>(null)

  // Right column state
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [slots, setSlots] = useState<Date[]>([])
  const [slotSel, setSlotSel] = useState<Date | null>(null)
  const [dispon, setDispon] = useState<DisponibilidadeItem[]>([])
  const [bookings, setBookings] = useState<{ inicio: Date; fim: Date }[]>([])
  const [loading, setLoading] = useState(false)

  // Derived
  const clienteValidExisting = !!clienteSel
  const clienteValidNew = clienteNome.trim().length > 0 && isValidEmail(clienteEmail) && (clienteTelefone === "" || isValidPhone(clienteTelefone))
  const clienteReady = clienteValidExisting || clienteValidNew

  const duracaoMin = servicoSel?.duracaoMin ?? 30

  const precoFinal = useMemo(() => {
    return servicoSel?.precoBase ?? 0
  }, [servicoSel])

  // Fetch details after selecting service
  useEffect(() => {
    if (!servicoSel?.id) return
    void (async () => {
      try {
        const res = await fetch(`/api/admin/servicos/${servicoSel.id}`)
        if (res.ok) {
          const sUnknown: unknown = await res.json()
          const s: Record<string, unknown> = (sUnknown && typeof sUnknown === 'object') ? (sUnknown as Record<string, unknown>) : {}
          setServicoSel((prev) => {
            if (!prev) return prev
            const nomeSrv = typeof s.nome === 'string' ? s.nome : prev.nome
            const dur = typeof s.duracaoMinutos === 'number' ? s.duracaoMinutos : (prev.duracaoMin ?? 30)
            const preco = typeof s.precoBase === 'string' ? Number(s.precoBase) : (typeof s.precoBase === 'number' ? s.precoBase : (prev.precoBase ?? 0))
            return { id: prev.id, nome: nomeSrv, duracaoMin: dur, precoBase: preco }
          })
        }
      } catch {}
    })()
  }, [servicoSel?.id])

  // Fetch disponibilidade after selecting barber
  useEffect(() => {
    if (!barbeiroSel?.id) return
    void (async () => {
      try {
        const res = await fetch(`/api/disponibilidade?barbeiroId=${barbeiroSel.id}`)
        if (res.ok) {
          const rowsUnknown: unknown = await res.json()
          const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as DisponibilidadeItem[]) : []
          setDispon(rows)
        }
      } catch {}
    })()
    // fetch bookings
    void (async () => {
      try {
        const res = await fetch(`/api/agendamentos`, { cache: "no-store" })
        if (res.ok) {
          const rowsUnknown: unknown = await res.json()
          const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as Array<Record<string, unknown>>) : []
          const filtered = rows.filter((r) => String(r.fkBarbeiroId ?? r.barbeiro_user_id) === barbeiroSel.id)
          setBookings(filtered.map((r) => {
            const start = new Date(String(r.dataHoraInicio ?? r.data_hora))
            const endVal = (r.dataHoraFim as string | undefined) ?? undefined
            const end = endVal ? new Date(endVal) : new Date(start.getTime() + (duracaoMin * 60000))
            return { inicio: start, fim: end }
          }))
        }
      } catch {}
    })()
  }, [barbeiroSel?.id, duracaoMin])

  // Recompute slots when inputs change
  useEffect(() => {
    if (!barbeiroSel?.id || !date || !servicoSel?.id) { setSlots([]); setSlotSel(null); return }
    const eff = computeDailyWorkIntervals(dispon, barbeiroSel.id, date)
    const dayBookings = bookings.filter((b) => b.inicio.getFullYear() === date.getFullYear() && b.inicio.getMonth() === date.getMonth() && b.inicio.getDate() === date.getDate())
    const slotDates = generateAvailableSlots(
      eff,
      dayBookings.map((b) => ({ barbeiroId: String(barbeiroSel.id), inicio: b.inicio, fim: b.fim })),
      date,
      duracaoMin,
      30,
    ).filter((d) => d.getTime() > Date.now())
    setSlots(slotDates)
    // reset selected if not present
    if (slotSel && !slotDates.find((d) => d.getTime() === slotSel.getTime())) {
      setSlotSel(null)
    }
  }, [barbeiroSel?.id, date, dispon, bookings, duracaoMin, servicoSel?.id, slotSel])

  function resetAll() {
    setClienteQuery("")
    setClienteSel(null)
    setClienteNome("")
    setClienteEmail("")
    setClienteTelefone("")
    setServicoQuery("")
    setServicoSel(null)
    setBarbeiroQuery("")
    setBarbeiroSel(null)
    setDate(undefined)
    setSlots([])
    setSlotSel(null)
    setDispon([])
    setBookings([])
    setLoading(false)
  }

  const canCreate = clienteReady && !!servicoSel?.id && !!barbeiroSel?.id && !!slotSel

  async function ensureCliente(): Promise<{ id: string; email: string; nome: string } | null> {
    if (clienteSel?.id && clienteSel.email) return { id: clienteSel.id, email: clienteSel.email, nome: clienteSel.name }
    // create new
    if (!clienteValidNew) return null
    try {
      const res = await fetch("/api/admin/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: clienteNome.trim(), email: clienteEmail.trim(), telefone: clienteTelefone.trim() || undefined })
      })
      if (!res.ok) return null
      const rowUnknown: unknown = await res.json()
      let row: Record<string, unknown> = {}
      if (rowUnknown && typeof rowUnknown === 'object') {
        row = rowUnknown as Record<string, unknown>
      }
      const id = typeof row.userId === 'string' ? row.userId : (typeof row.id === 'string' ? row.id : '')
      const email = typeof row.email === 'string' ? row.email : ''
      const nome = typeof row.nome === 'string' ? row.nome : ''
      return id ? { id, email, nome } : null
    } catch {
      return null
    }
  }

  async function handleCriar() {
    if (!canCreate || !slotSel || !servicoSel?.id || !barbeiroSel?.email) return
    setLoading(true)
    const cliente = await ensureCliente()
    if (!cliente) { setLoading(false); return }
    try {
      // Need barber email for API; fetch by id not implemented here, use selected suggestion which includes email
      const payload = {
        clienteEmail: cliente.email,
        barbeiroEmail: barbeiroSel.email,
        servicoId: servicoSel.id,
        dataHoraInicio: slotSel.toISOString(),
        dataHoraFim: new Date(slotSel.getTime() + (duracaoMin * 60000)).toISOString(),
        valorCobrado: String(precoFinal.toFixed(2)),
      }
      const res = await fetch("/api/agendamentos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { console.error("create agendamento falhou", await res.text()); setLoading(false); return }
      const rowUnknown: unknown = await res.json()
      let row: Record<string, unknown> = {}
      if (rowUnknown && typeof rowUnknown === 'object') {
        row = rowUnknown as Record<string, unknown>
      }
      const novo: Agendamento = {
        id: String(row.agendamentoId ?? row.id),
        cliente_user_id: typeof row.fkClienteId === 'string' ? row.fkClienteId : '',
        barbeiro_user_id: typeof row.fkBarbeiroId === 'string' ? row.fkBarbeiroId : '',
        servico_id: typeof row.fkServicoId === 'string' ? row.fkServicoId : '',
        data_hora: new Date(typeof row.dataHoraInicio === 'string' ? row.dataHoraInicio : new Date().toISOString()),
        status: "confirmado",
        preco_final: precoFinal,
        created_at: new Date(),
        updated_at: new Date(),
            cliente: { id: cliente.id, clerk_user_id: "", nome: cliente.nome, email: cliente.email, telefone: clienteTelefone, tipo: "cliente", created_at: new Date(), updated_at: new Date() },
        barbeiro: barbeiroSel ? { id: barbeiroSel.id, clerk_user_id: "", nome: barbeiroSel.name, email: barbeiroSel.email ?? "", telefone: barbeiroSel.phone ?? "", tipo: "barbeiro", created_at: new Date(), updated_at: new Date() } : undefined,
        servico: servicoSel ? { id: servicoSel.id, nome: servicoSel.nome, duracao_minutos: duracaoMin, preco_base: servicoSel.precoBase ?? 0, ativo: true, created_at: new Date(), updated_at: new Date() } : undefined,
      }
      onAgendamentoCriado(novo)
      resetAll()
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const emailValid = (typeof clienteSel?.email === 'string') ? true : isValidEmail(clienteEmail)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { resetAll(); onOpenChange(false) } }}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar para Cliente</DialogTitle>
          <DialogDescription>Preencha os dados e selecione a data/horário disponível</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <UserAutocomplete
                  value={clienteQuery}
                  onChange={setClienteQuery}
                  onSelect={(s) => { setClienteSel(s); setClienteQuery(s.name); setClienteNome(s.name); setClienteEmail(s.email ?? ""); setClienteTelefone(s.phone ?? "") }}
                  searchApi="/api/admin/clientes/search"
                  label="Cliente"
                  placeholder="Buscar cliente por nome ou email"
                />
                <div className="grid gap-2">
                  <Label>Nome</Label>
                  <Input value={clienteNome} onChange={(e) => { setClienteNome(e.target.value); setClienteSel(null) }} placeholder="Nome completo" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={clienteEmail} onChange={(e) => { setClienteEmail(e.target.value); setClienteSel(null) }} placeholder="email@exemplo.com" />
                </div>
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input value={clienteTelefone} onChange={(e) => setClienteTelefone(formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Serviço</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <UserAutocomplete
                  value={servicoQuery}
                  onChange={setServicoQuery}
                  onSelect={(s) => { setServicoSel({ id: s.id, nome: s.name }); setServicoQuery(s.name) }}
                  searchApi="/api/admin/servicos/search"
                  label="Serviço"
                  placeholder="Buscar serviço"
                />
                {servicoSel && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {duracaoMin} min</div>
                    <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> R$ {precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Barbeiro</CardTitle></CardHeader>
              <CardContent>
                <UserAutocomplete
                  value={barbeiroQuery}
                  onChange={setBarbeiroQuery}
                  onSelect={(s) => { setBarbeiroSel(s); setBarbeiroQuery(s.name) }}
                  searchApi="/api/admin/barbeiros/search"
                  label="Barbeiro"
                  placeholder="Buscar barbeiro"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Data</CardTitle></CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => setDate(d ?? undefined)}
                  disabled={(d) => d < new Date()}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Horários Disponíveis</CardTitle></CardHeader>
              <CardContent>
                {!barbeiroSel?.id || !servicoSel?.id || !date ? (
                  <p className="text-sm text-muted-foreground">Selecione cliente, serviço, barbeiro e data.</p>
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
              <Button variant="outline" onClick={() => { resetAll(); onOpenChange(false) }}>Cancelar</Button>
              <Button className="flex-1" disabled={!canCreate || loading || !emailValid} onClick={() => void handleCriar()}>
                {loading ? "Agendando..." : "Criar Agendamento"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
