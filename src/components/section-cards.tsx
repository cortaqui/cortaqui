import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "../components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"

type SectionCardsProps = {
  receitaTotal: number
  novosClientes: number
  totalAgendamentos: number
  agendamentosHoje: number
  receitaDeltaPct?: number
  novosClientesDeltaPct?: number
  totalAgendamentosDeltaPct?: number
  agendamentosHojeDeltaPct?: number
}

export function SectionCards({
  receitaTotal,
  novosClientes,
  totalAgendamentos,
  agendamentosHoje,
  receitaDeltaPct = 0,
  novosClientesDeltaPct = 0,
  totalAgendamentosDeltaPct = 0,
  agendamentosHojeDeltaPct = 0,
}: SectionCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Receita Total</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {`R$ ${receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {receitaDeltaPct >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {`${receitaDeltaPct >= 0 ? "+" : ""}${receitaDeltaPct.toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {receitaDeltaPct >= 0 ? "Aumento nesse mês" : "Queda nesse mês"} {receitaDeltaPct >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Novos clientes</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {novosClientes}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {novosClientesDeltaPct >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {`${novosClientesDeltaPct >= 0 ? "+" : ""}${novosClientesDeltaPct.toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {novosClientesDeltaPct >= 0 ? "Mais clientes neste período" : "Menos clientes neste período"} {novosClientesDeltaPct >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total de Agendamentos</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalAgendamentos}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {totalAgendamentosDeltaPct >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {`${totalAgendamentosDeltaPct >= 0 ? "+" : ""}${totalAgendamentosDeltaPct.toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {totalAgendamentosDeltaPct >= 0 ? "Crescimento no período" : "Queda no período"} {totalAgendamentosDeltaPct >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Agendamentos Hoje</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {agendamentosHoje}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {agendamentosHojeDeltaPct >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {`${agendamentosHojeDeltaPct >= 0 ? "+" : ""}${agendamentosHojeDeltaPct.toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {agendamentosHojeDeltaPct >= 0 ? "Dia movimentado" : "Dia abaixo do esperado"} {agendamentosHojeDeltaPct >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
