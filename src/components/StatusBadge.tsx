import { Badge } from "~/components/ui/badge"
import type { Agendamento } from "~/lib/types"

interface StatusBadgeProps {
  status: Agendamento["status"]
  variant?: "default" | "compact"
}

const getStatusBadgeVariant = (status: Agendamento["status"]) => {
  switch (status) {
    case "concluido":
      return "default"
    case "em_andamento":
      return "default"
    case "confirmado":
      return "secondary"
    case "cancelado":
      return "destructive"
    case "agendado":
    default:
      return "outline"
  }
}

const getStatusLabel = (status: Agendamento["status"]) => {
  switch (status) {
    case "agendado":
      return "Agendado"
    case "confirmado":
      return "Confirmado"
    case "em_andamento":
      return "Em Andamento"
    case "concluido":
      return "Concluído"
    case "cancelado":
      return "Cancelado"
    default:
      return status
  }
}

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  )
}
