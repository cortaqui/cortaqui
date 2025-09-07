"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Calendar } from "~/components/ui/calendar"
import { Scissors, User, CalendarDays } from "lucide-react"
import { useIsMobile } from "~/hooks/use-mobile"
import { ClerkAuthButtons } from "~/components/ClerkAuthButtons"
import { MobileNavSheet } from "~/components/MobileNavSheet"
import { Logo } from "~/components/logo"
import { UserAutocomplete, type Suggestion } from "~/components/UserAutocomplete"
import { SignedIn, SignedOut } from "@clerk/nextjs"
import { computeDailyWorkIntervals, generateAvailableSlots, type DisponibilidadeItem } from "~/lib/agendamento-utils"

export default function AgendarPage() {
  const isMobile = useIsMobile()
  const [servicoQuery, setServicoQuery] = useState("")
  const [servicoSel, setServicoSel] = useState<{ id: string; nome: string; duracaoMin?: number; precoBase?: number } | null>(null)
  const [barbeiroQuery, setBarbeiroQuery] = useState("")
  const [barbeiroSel, setBarbeiroSel] = useState<Suggestion | null>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [slots, setSlots] = useState<Date[]>([])
  const [slotSel, setSlotSel] = useState<Date | null>(null)
  const [dispon, setDispon] = useState<DisponibilidadeItem[]>([])
  const [bookings, setBookings] = useState<{ inicio: Date; fim: Date }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const duracaoMin = servicoSel?.duracaoMin ?? 30
  const precoFinal = useMemo(() => servicoSel?.precoBase ?? 0, [servicoSel])

  // Auth handled via Clerk SignedIn/SignedOut components

  useEffect(() => {
    if (!servicoSel?.id) return
    void (async () => {
      try {
        const res = await fetch(`/api/cliente/servicos/${servicoSel.id}`)
        if (res.ok) {
          const sUnknown: unknown = await res.json()
          let s: Record<string, unknown> = {}
          if (sUnknown && typeof sUnknown === 'object') {
            s = sUnknown as Record<string, unknown>
          }
          setServicoSel((prev) => {
            if (!prev) return prev
            const nomeSrv = typeof s.nome === 'string' ? s.nome : prev.nome
            const dur = typeof s.duracaoMinutos === 'number' ? s.duracaoMinutos : (prev.duracaoMin ?? 30)
            // drizzle decimal likely comes as string in row.precoBase
            const precoRaw = s.precoBase
            const preco = typeof precoRaw === 'string' ? Number(precoRaw) : (typeof precoRaw === 'number' ? precoRaw : (prev.precoBase ?? 0))
            return { id: prev.id, nome: nomeSrv, duracaoMin: dur, precoBase: preco }
          })
        }
      } catch {}
    })()
  }, [servicoSel?.id])

  useEffect(() => {
    if (!barbeiroSel?.id) return
    void (async () => {
      try {
        const res = await fetch(`/api/cliente/disponibilidade?barbeiroId=${barbeiroSel.id}`)
        if (res.ok) {
          const rowsUnknown: unknown = await res.json()
          const rows = Array.isArray(rowsUnknown) ? (rowsUnknown as DisponibilidadeItem[]) : []
          setDispon(rows)
        }
      } catch {}
    })()
    if (!date) return
    void (async () => {
      try {
        const dateISO = date.toISOString().slice(0,10)
        const res = await fetch(`/api/cliente/agendamentos?barbeiroId=${barbeiroSel.id}&date=${dateISO}`, { cache: "no-store" })
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
  }, [barbeiroSel?.id, duracaoMin, date])

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
    if (slotSel && !slotDates.find((d) => d.getTime() === slotSel.getTime())) setSlotSel(null)
  }, [barbeiroSel?.id, date, dispon, bookings, duracaoMin, servicoSel?.id, slotSel])

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between py-3">
          <Logo text="Cortaqui" />
          {isMobile ? (
            <div className="flex items-center gap-3">
              <ClerkAuthButtons />
              <MobileNavSheet
                items={[
                  { title: "Agendar", url: "/agendar", icon: CalendarDays },
                  { title: "Meus Agendamentos", url: "/meus-agendamentos", icon: User },
                ]}
              />
            </div>
          ) : (
            <nav className="flex items-center gap-4">
              <a href="/agendar" className="text-sm hover:underline">Agendar</a>
              <a href="/meus-agendamentos" className="text-sm hover:underline">Meus Agendamentos</a>
              <ClerkAuthButtons />
            </nav>
          )}
        </div>
      </header>

      <SignedOut>
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <h2 className="text-xl font-semibold">Você precisa estar logado para agendar</h2>
          <ClerkAuthButtons />
        </div>
      </SignedOut>

      <SignedIn>
      {!servicoSel ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Escolha um Serviço</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <UserAutocomplete
                value={servicoQuery}
                onChange={setServicoQuery}
                onSelect={(s) => { setServicoSel({ id: s.id, nome: s.name }); setServicoQuery(s.name) }}
                searchApi="/api/servicos/search"
                placeholder="Buscar serviço"
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Serviço Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{servicoSel.nome}</h3>
                  <p className="text-sm text-muted-foreground">{duracaoMin} minutos</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    R$ {precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => { setServicoSel(null); setBarbeiroSel(null); setDate(undefined); setSlots([]); setSlotSel(null) }}>
                    Alterar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                   Escolher Barbeiro
                </CardTitle>
                <CardDescription>Selecione o profissional desejado</CardDescription>
              </CardHeader>
              <CardContent>
                <UserAutocomplete
                  value={barbeiroQuery}
                  onChange={setBarbeiroQuery}
                  onSelect={(s) => { setBarbeiroSel(s); setBarbeiroQuery(s.name) }}
                  searchApi="/api/cliente/barbeiros/search"
                  placeholder="Buscar barbeiro"
                />
                {!barbeiroSel && <p className="text-xs text-destructive mt-2">Selecione um barbeiro para continuar.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Escolher Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>

          {date && (
            <Card>
              <CardHeader>
                <CardTitle>Horários Disponíveis</CardTitle>
                <CardDescription>
                  {date.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data. Escolha outra data.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
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
          )}

          {slotSel && barbeiroSel && (
            <Card>
              <CardHeader>
                <CardTitle>Confirmar Agendamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <p>
                    <strong>Serviço:</strong> {servicoSel.nome}
                  </p>
                  <p>
                    <strong>Barbeiro:</strong> {barbeiroSel?.name ?? "Qualquer barbeiro disponível"}
                  </p>
                  <p>
                    <strong>Data:</strong> {date?.toLocaleDateString("pt-BR")}
                  </p>
                  <p>
                    <strong>Horário:</strong> {slotSel.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p>
                    <strong>Valor:</strong> R$ {precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {error && <p className="text-sm text-destructive mb-2">{error}</p>}
                <Button onClick={async () => {
                  try {
                    setError(null)
                    setLoading(true)
                    const payload = {
                      clienteEmail: undefined, // server derives by role (client)
                      barbeiroEmail: barbeiroSel?.email ?? '',
                      servicoId: servicoSel.id,
                      dataHoraInicio: slotSel.toISOString(),
                      dataHoraFim: new Date(slotSel.getTime() + (duracaoMin * 60000)).toISOString(),
                      valorCobrado: String(precoFinal.toFixed(2)),
                    }
                    if (!barbeiroSel?.email) { setError('Selecione um barbeiro'); return }
                    const res = await fetch('/api/cliente/agendamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                    if (!res.ok) { setError('Erro ao criar agendamento'); return }
                    window.location.href = '/meus-agendamentos'
                  } catch {
                    setError('Erro ao criar agendamento')
                  } finally {
                    setLoading(false)
                  }
                }} className="w-full" disabled={loading}>
                  {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </SignedIn>
    </div>
  )
}
