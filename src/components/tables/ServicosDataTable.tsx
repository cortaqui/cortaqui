"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Badge } from "~/components/ui/badge"
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Scissors } from "lucide-react"
import type { Servico } from "~/lib/types"

interface ServicosDataTableProps {
  servicos: Servico[]
  title?: string
  description?: string
  onEdit?: (servico: Servico) => void
  onDelete?: (servicoId: string) => void
}

export function ServicosDataTable({
  servicos,
  title = "Lista de Serviços",
  description,
  onEdit,
  onDelete
}: ServicosDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter servicos based on search and status
  const filteredServicos = useMemo(() => {
    return servicos.filter((servico) => {
      const matchesSearch = (searchTerm === "" ||
        servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servico.descricao?.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = (statusFilter === "todos" ||
        (statusFilter === "ativo" && servico.ativo) ||
        (statusFilter === "inativo" && !servico.ativo))

      return matchesSearch && matchesStatus
    })
  }, [servicos, searchTerm, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredServicos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedServicos = filteredServicos.slice(startIndex, startIndex + itemsPerPage)

  const statusOptions = [
    { value: "todos", label: "Todos os Status" },
    { value: "ativo", label: "Ativos" },
    { value: "inativo", label: "Inativos" }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
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
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Duração (min)</TableHead>
                <TableHead className="text-right">Preço Base</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedServicos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm || statusFilter !== "todos"
                      ? "Nenhum serviço encontrado com os filtros aplicados."
                      : "Nenhum serviço encontrado."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                paginatedServicos.map((servico) => (
                  <TableRow key={servico.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{servico.nome}</div>
                        {servico.descricao && (
                          <div className="text-sm text-muted-foreground">{servico.descricao}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{servico.duracao_minutos}</TableCell>
                    <TableCell className="text-right">
                      R$ {servico.preco_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={servico.ativo ? "default" : "secondary"}>
                        {servico.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(servico)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(servico.id)}
                          >
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
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredServicos.length)} de {filteredServicos.length} serviços
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
