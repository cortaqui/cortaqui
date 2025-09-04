"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "../hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import type { ChartConfig } from "../components/ui/chart"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../components/ui/toggle-group"

export type AreaPoint = { date: string; faturamento: number }

const chartConfig = {
  faturamento: {
    label: "Faturamento",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function FaturamentoChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [data, setData] = React.useState<AreaPoint[]>([])

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/agendamentos")
        const agUnknown: unknown = res.ok ? await res.json() : []
        const ag = (Array.isArray(agUnknown) ? agUnknown : []) as Array<{ dataHoraInicio?: string; data_hora?: string; valorCobrado?: string; status?: string }>
        const byDay = new Map<string, number>()
        for (const a of ag) {
          if (a.status !== 'CONCLUIDO') continue
          const iso = a.dataHoraInicio ?? a.data_hora
          if (!iso) continue
          const d = new Date(iso)
          const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)
          const valor = a.valorCobrado ? Number(a.valorCobrado) : 0
          byDay.set(key, (byDay.get(key) ?? 0) + valor)
        }
        const points: AreaPoint[] = Array.from(byDay.entries())
          .sort((a, b) => (a[0] < b[0] ? -1 : 1))
          .map(([date, faturamento]) => ({ date, faturamento }))
        setData(points)
      } catch {}
    }
    void fetchData()
  }, [])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = data.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="..container/card">
      <CardHeader>
        <CardTitle>Evolução do Faturamento</CardTitle>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 ..[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Últimos 3 meses</ToggleGroupItem>
            <ToggleGroupItem value="30d">Últimos 30 dias</ToggleGroupItem>
            <ToggleGroupItem value="7d">Últimos 7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate ..[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Últimos 3 meses
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Últimos 30 dias
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Últimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillFaturamento" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-faturamento)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-faturamento)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value as string)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value as string).toLocaleDateString("pt-BR", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="faturamento"
              type="natural"
              fill="url(#fillFaturamento)"
              stroke="var(--color-faturamento)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
