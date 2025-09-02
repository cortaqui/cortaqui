import { Card, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { User, Clock, Calendar, Scissors, CreditCard, X } from "lucide-react"
import type { Agendamento } from "~/lib/types"
import { StatusBadge } from "./StatusBadge"

interface AgendamentoCardProps {
  agendamento: Agendamento
  showActions?: boolean
  onCancel?: (agendamento: Agendamento) => void
  onPay?: (agendamento: Agendamento) => void
  variant?: "compact" | "detailed"
}


export function AgendamentoCard({
  agendamento,
  showActions = false,
  onCancel,
  onPay,
  variant = "detailed"
}: AgendamentoCardProps) {
  if (variant === "compact") {
    return (
      <Card className="mb-2">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{agendamento.cliente?.nome}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {agendamento.data_hora.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>•</span>
                <span>{agendamento.servico?.nome}</span>
              </div>
            </div>
            <StatusBadge status={agendamento.status} />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              <span className="font-semibold">{agendamento.servico?.nome}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{agendamento.barbeiro?.nome}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{agendamento.data_hora.toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {agendamento.data_hora.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                R$ {agendamento.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              <StatusBadge status={agendamento.status} />
            </div>
          </div>
          {showActions && (
            <div className="flex flex-col gap-2">
              {onPay && (
                <Button
                  size="sm"
                  onClick={() => onPay(agendamento)}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Pagar
                </Button>
              )}
              {(agendamento.status === "agendado" || agendamento.status === "confirmado") && onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancel(agendamento)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
