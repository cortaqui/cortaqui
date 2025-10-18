"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Calendar, Search, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react"
import type { Agendamento } from "~/lib/types"
import { StatusBadge } from "../StatusBadge"

interface AgendamentosDataTableProps {
  agendamentos: Agendamento[]
  title?: string
  description?: string
  onEdit?: (agendamento: Agendamento) => void
  onDelete?: (agendamentoId: string) => void
}

export function AgendamentosDataTable({
  agendamentos,
  title = "Lista de Agendamentos",
  description,
  onEdit,
  onDelete
}: AgendamentosDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter agendamentos based on search and status
  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter((agendamento) => {
      const q = searchTerm.toLowerCase()
      const matchesSearch = (
        searchTerm === "" ||
        (agendamento.cliente?.nome?.toLowerCase().includes(q) ?? false) ||
        (agendamento.barbeiro?.nome?.toLowerCase().includes(q) ?? false) ||
        (agendamento.servico?.nome?.toLowerCase().includes(q) ?? false)
      )

      // Support both lowercase and uppercase filters
      const matchesStatus = (
        statusFilter === "todos" ||
        agendamento.status === statusFilter ||
        agendamento.status.toUpperCase() === statusFilter
      )

      return matchesSearch && matchesStatus
    })
  }, [agendamentos, searchTerm, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredAgendamentos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAgendamentos = filteredAgendamentos.slice(startIndex, startIndex + itemsPerPage)

  const statusOptions = [
    { value: "todos", label: "Todos os Status" },
    { value: "PENDENTE", label: "Pendete" },
    { value: "CONFIRMADO", label: "Confirmado" },
    { value: "CANCELADO", label: "Cancelado" },
    { value: "CONCLUIDO", label: "Concluído" }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, barbeiro ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-80"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Barbeiro</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAgendamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {searchTerm || statusFilter !== "todos"
                      ? "Nenhum agendamento encontrado com os filtros aplicados."
                      : "Nenhum agendamento encontrado."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAgendamentos.map((agendamento) => (
                  <TableRow key={agendamento.id}>
                    <TableCell className="font-medium">
                      {agendamento.cliente?.nome ?? "—"}
                    </TableCell>
                    <TableCell>{agendamento.barbeiro?.nome ?? "—"}</TableCell>
                    <TableCell>{agendamento.servico?.nome ?? "—"}</TableCell>
                    <TableCell>
                      <div>
                        <div>{agendamento.data_hora.toLocaleDateString("pt-BR")}</div>
                        <div className="text-sm text-muted-foreground">
                          {agendamento.data_hora.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={agendamento.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {agendamento.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <Button variant="outline" size="sm" onClick={() => onEdit(agendamento)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button variant="outline" size="sm" onClick={() => onDelete(agendamento.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredAgendamentos.length)} de {filteredAgendamentos.length} agendamentos
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => {
                    const prevPage = array[index - 1]
                    const showEllipsis = prevPage && page - prevPage > 1

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && <span className="px-2">...</span>}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </div>
                    )
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
