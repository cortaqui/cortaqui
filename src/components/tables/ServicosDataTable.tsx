"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Badge } from "~/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Scissors } from "lucide-react"
import type { Servico } from "~/lib/types"

interface ServicosDataTableProps {
  servicos: Servico[]
  title?: string
  description?: string
  onEdit?: (servico: Servico) => void
  onDelete?: (servicoId: string) => void
  refreshKey?: number
}

export function ServicosDataTable({
  servicos,
  title = "Lista de Serviços",
  description,
  onEdit,
  onDelete,
  refreshKey
}: ServicosDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [barbeirosByServico, setBarbeirosByServico] = useState<Record<string, Array<{ id: string; nome: string }>>>({})
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

  // Hydrate associated barbers for current page
  const pageIdsKey = useMemo(() => `${refreshKey ?? 0}|` + paginatedServicos.map((s) => s.id).join("|"), [paginatedServicos, refreshKey])
  const assocCacheRef = useRef<Record<string, Array<{ id: string; nome: string }>>>({})
  const lastKeyRef = useRef<string>("")
  const lastRefreshRef = useRef<number | undefined>(undefined)

  // Invalidate cache when refreshKey changes (e.g., after modal edit saves)
  useEffect(() => {
    if (lastRefreshRef.current !== refreshKey) {
      assocCacheRef.current = {}
      lastRefreshRef.current = refreshKey
      // force next effect run to refetch for current page ids
      lastKeyRef.current = ""
    }
  }, [refreshKey])

  useEffect(() => {
    if (lastKeyRef.current === pageIdsKey) {
      // same page ids, nothing to do
      return
    }
    lastKeyRef.current = pageIdsKey
    const ids = paginatedServicos.map((s) => s.id)
    const idsToFetch = ids.filter((id) => !assocCacheRef.current[id])
    if (idsToFetch.length === 0) {
      // just sync state from cache for current page
      const next: Record<string, Array<{ id: string; nome: string }>> = {}
      for (const id of ids) next[id] = assocCacheRef.current[id] ?? []
      setBarbeirosByServico(next)
      return
    }
    let cancelled = false
    void (async () => {
      const entries = await Promise.all(idsToFetch.map(async (id) => {
        try {
          const res = await fetch(`/api/admin/servicos/${encodeURIComponent(id)}/barbeiros`, { cache: "no-store" })
          if (!res.ok) return [id, [] as Array<{ id: string; nome: string }>] as const
          const rowsUnknown: unknown = await res.json()
          const rows = Array.isArray(rowsUnknown) ? rowsUnknown as Array<{ id?: unknown; nome?: unknown; name?: unknown }> : []
          const mapped = rows.map((r) => ({ id: typeof r.id === 'string' ? r.id : '', nome: typeof r.nome === 'string' ? r.nome : (typeof r.name === 'string' ? r.name : '') }))
          return [id, mapped] as const
        } catch {
          return [id, [] as Array<{ id: string; nome: string }>] as const
        }
      }))
      if (cancelled) return
      for (const [id, arr] of entries) assocCacheRef.current[id] = arr
      const next: Record<string, Array<{ id: string; nome: string }>> = {}
      for (const id of ids) next[id] = assocCacheRef.current[id] ?? []
      setBarbeirosByServico(next)
    })()
    return () => { cancelled = true }
  }, [pageIdsKey, paginatedServicos])

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
                <TableHead>Barbeiros</TableHead>
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
                    <TableCell>
                      <div className="flex -space-x-2">
                        {(barbeirosByServico[servico.id] ?? []).slice(0,6).map((b) => (
                          <Avatar key={b.id} className="h-6 w-6 ring-2 ring-background">
                            <AvatarImage />
                            <AvatarFallback>{b.nome?.[0]?.toUpperCase() ?? 'B'}</AvatarFallback>
                          </Avatar>
                        ))}
                        {(barbeirosByServico[servico.id]?.length ?? 0) > 6 && (
                          <div className="text-xs text-muted-foreground pl-2">+{(barbeirosByServico[servico.id]!.length - 6)}</div>
                        )}
                      </div>
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
