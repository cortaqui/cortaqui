import { addMinutes } from "date-fns"
import type { Agendamento } from "~/lib/types"
import type { CalendarEvent, EventColor } from "~/components/event-calendar/types"

export type DisponibilidadeItem = {
  id: string
  barbeiro_user_id: string
  tipo: "TRABALHO" | "BLOQUEIO"
  recorrente: boolean
  dia_semana: number | null
  hora_inicio: string // HH:mm
  hora_fim: string    // HH:mm
  data_especifica: string | null
  updated_at: string | Date
}

export type BookingItem = {
  barbeiroId: string
  inicio: Date
  fim: Date
}

// Barbeiro color scheme for calendar events - matches etiquettes
export const barbeiroColors: Record<string, EventColor> = {
  "1": "blue",    // João Silva
  "2": "emerald", // Carlos Santos
  "3": "orange",  // Pedro Oliveira
  // Add more as needed
} as const

// Fallback color for barbeiros not in the color map
const DEFAULT_BARBEIRO_COLOR: EventColor = "violet"

// Get color by barbeiro ID
export const getColorByBarbeiro = (barbeiroId?: string): EventColor => {
  if (!barbeiroId) return DEFAULT_BARBEIRO_COLOR
  return barbeiroColors[barbeiroId] ?? DEFAULT_BARBEIRO_COLOR
}

// Transform agendamentos to calendar events
export const transformAgendamentosToEvents = (agendamentos: Agendamento[]): CalendarEvent[] => {
  return agendamentos.map(agendamento => {
    const startTime = new Date(agendamento.data_hora)
    const duration = agendamento.servico?.duracao_minutos ?? 30
    const endTime = addMinutes(startTime, duration)

    return {
      id: agendamento.id,
      title: `${agendamento.cliente?.nome} - ${agendamento.servico?.nome}`,
      description: `Barbeiro: ${agendamento.barbeiro?.nome}${agendamento.observacoes ? `\n\nObservações: ${agendamento.observacoes}` : ''}`,
      start: startTime,
      end: endTime,
      color: getColorByBarbeiro(agendamento.barbeiro_user_id),
      location: "Barbearia Tradição do Boleiro",
      // Store the original agendamento for easy access
      agendamento: agendamento
    } as CalendarEvent & { agendamento: Agendamento }
  })
}

// Transform calendar event back to agendamento (for updates)
export const transformEventToAgendamento = (event: CalendarEvent & { agendamento: Agendamento }): Agendamento => {
  return {
    ...event.agendamento,
    data_hora: event.start,
    // Update service duration if end time changed
    servico: {
      ...event.agendamento.servico!,
      duracao_minutos: Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60))
    }
  }
}

// Status color mapping for status badges
export const getStatusColor = (status: Agendamento["status"]): string => {
  const statusColors = {
    "agendado": "blue",
    "confirmado": "emerald",
    "em_andamento": "orange",
    "concluido": "green",
    "cancelado": "red"
  }
  return statusColors[status] || "gray"
}

// Filter agendamentos by status
export const filterAgendamentosByStatus = (
  agendamentos: Agendamento[],
  visibleStatus: Agendamento["status"][]
): Agendamento[] => {
  if (visibleStatus.length === 0) return agendamentos
  return agendamentos.filter(agendamento => visibleStatus.includes(agendamento.status))
}

// Filter agendamentos by barbeiro
export const filterAgendamentosByBarbeiro = (
  agendamentos: Agendamento[],
  visibleBarbeiros: string[]
): Agendamento[] => {
  if (visibleBarbeiros.length === 0) return agendamentos
  return agendamentos.filter(agendamento =>
    visibleBarbeiros.includes(agendamento.barbeiro_user_id)
  )
}

// ----------------------
// Slot generation helpers
// ----------------------

function parseTimeToMinutes(time: string): number {
  const parts = time.split(":")
  const h = Number(parts[0] ?? 0)
  const m = Number(parts[1] ?? 0)
  return h * 60 + m
}

function toDateAtTime(baseDate: Date, minutes: number): Date {
  const d = new Date(baseDate)
  d.setHours(0, 0, 0, 0)
  d.setMinutes(minutes)
  return d
}

type Interval = { startMin: number; endMin: number }

function intersectIntervals(a: Interval, b: Interval): Interval | null {
  const s = Math.max(a.startMin, b.startMin)
  const e = Math.min(a.endMin, b.endMin)
  return e > s ? { startMin: s, endMin: e } : null
}

function subtractIntervals(source: Interval, blockers: Interval[]): Interval[] {
  let result: Interval[] = [source]
  for (const b of blockers) {
    const next: Interval[] = []
    for (const r of result) {
      const inter = intersectIntervals(r, b)
      if (!inter) {
        next.push(r)
      } else {
        if (inter.startMin > r.startMin) next.push({ startMin: r.startMin, endMin: inter.startMin })
        if (inter.endMin < r.endMin) next.push({ startMin: inter.endMin, endMin: r.endMin })
      }
    }
    result = next
  }
  return result
}

export function computeDailyWorkIntervals(
  all: DisponibilidadeItem[],
  barberId: string,
  date: Date
): Interval[] {
  const dayIdx = date.getDay()
  const forBarber = all.filter(d => d.barbeiro_user_id === barberId)
  const recurrentWork = forBarber.filter(d => d.tipo === "TRABALHO" && d.recorrente && d.dia_semana === dayIdx)
  const specificWork = forBarber.filter(d => d.tipo === "TRABALHO" && !d.recorrente && !!d.data_especifica && sameDayIso(d.data_especifica, date))
  const blockersRecurrent = forBarber.filter(d => d.tipo === "BLOQUEIO" && d.recorrente && d.dia_semana === dayIdx)
  const blockersSpecific = forBarber.filter(d => d.tipo === "BLOQUEIO" && !d.recorrente && !!d.data_especifica && sameDayIso(d.data_especifica, date))

  const workIntervals: Interval[] = [...recurrentWork, ...specificWork].map(d => ({
    startMin: parseTimeToMinutes(d.hora_inicio),
    endMin: parseTimeToMinutes(d.hora_fim),
  }))
  const blockers: Interval[] = [...blockersRecurrent, ...blockersSpecific].map(d => ({
    startMin: parseTimeToMinutes(d.hora_inicio),
    endMin: parseTimeToMinutes(d.hora_fim),
  }))

  // subtract blockers from each work interval
  const effective: Interval[] = []
  for (const w of workIntervals) {
    effective.push(...subtractIntervals(w, blockers))
  }
  // normalize merge
  return mergeIntervals(effective)
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return []
  const sorted = [...intervals].filter(Boolean).sort((a, b) => a.startMin - b.startMin)
  if (sorted.length === 0) return []
  const result: Interval[] = []
  let cur: Interval | null = sorted[0] ?? null
  for (let i = 1; i < sorted.length; i++) {
    const nxt: Interval | null = sorted[i] ?? null
    if (!cur) { cur = nxt; continue }
    if (!nxt) { continue }
    if (nxt.startMin <= cur.endMin) {
      cur = { startMin: cur.startMin, endMin: Math.max(cur.endMin, nxt.endMin) }
    } else {
      result.push(cur)
      cur = nxt
    }
  }
  if (cur) result.push(cur)
  return result
}

function sameDayIso(isoOrDate: string | Date, d: Date): boolean {
  const x = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate()
}

export function generateAvailableSlots(
  effectiveWork: Interval[],
  bookings: BookingItem[],
  date: Date,
  serviceDurationMin: number,
  stepMin = 30
): Date[] {
  // convert bookings to day-minute intervals for the barber
  const bookingIntervals: Interval[] = bookings.map(b => ({
    startMin: minutesSinceMidnight(b.inicio),
    endMin: minutesSinceMidnight(b.fim),
  }))

  const freeAfterBookings: Interval[] = []
  for (const w of effectiveWork) {
    freeAfterBookings.push(...subtractIntervals(w, bookingIntervals))
  }

  const slots: Date[] = []
  for (const f of freeAfterBookings) {
    for (let start = roundUpToStep(f.startMin, stepMin); start + serviceDurationMin <= f.endMin; start += stepMin) {
      slots.push(toDateAtTime(date, start))
    }
  }
  return slots
}

function roundUpToStep(minute: number, step: number): number {
  return Math.ceil(minute / step) * step
}

function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}
