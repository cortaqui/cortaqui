import { Badge } from "~/components/ui/badge"
import type { Agendamento } from "~/lib/types"

interface StatusBadgeProps {
  status: Agendamento["status"]
}

const getStatusBadgeVariant = (status: Agendamento["status"]) => {
  switch (status) {
    case "concluido":
      return "success"
    case "em_andamento":
      return "default"
    case "confirmado":
      return "info"
    case "cancelado":
      return "destructive"
    case "agendado":
    default:
      return "warning"
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

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={getStatusBadgeVariant(status)}>
      {getStatusLabel(status)}
    </Badge>
  )
}
