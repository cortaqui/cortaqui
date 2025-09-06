"use client"

import { useState, useMemo, type ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import {
  DEFAULT_TABLE_CONFIG,
  calculatePagination,
  getPaginationPages,
  createSearchFilter,
  createStatusFilter,
  getEmptyStateMessage,
  type PaginationConfig
} from "~/lib/table-configs"

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => ReactNode
  className?: string
}

export interface FilterOption {
  value: string
  label: string
}

export interface BaseDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  description?: string
  icon?: ReactNode
  searchPlaceholder?: string
  searchFields?: ((item: T) => string)[]
  statusFilter?: {
    value: string
    onChange: (value: string) => void
    options: FilterOption[]
    getStatus: (item: T) => string | boolean
  }
  emptyStateMessage?: string
  itemsPerPage?: number
}

export function BaseDataTable<T extends { id: string }>({
  data,
  columns,
  title,
  description,
  icon,
  searchPlaceholder = "Buscar...",
  searchFields = [],
  statusFilter,
  emptyStateMessage,
  itemsPerPage = DEFAULT_TABLE_CONFIG.itemsPerPage
}: BaseDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!searchFields.length) return data
    return createSearchFilter(data, searchTerm, searchFields)
  }, [data, searchTerm, searchFields])

  // Apply status filter
  const filteredData = useMemo(() => {
    if (!statusFilter) return searchFiltered
    return createStatusFilter(
      searchFiltered,
      statusFilter.value,
      statusFilter.getStatus
    )
  }, [searchFiltered, statusFilter])

  // Pagination
  const paginationConfig: PaginationConfig = {
    currentPage,
    itemsPerPage,
    totalItems: filteredData.length
  }

  const pagination = calculatePagination(paginationConfig)
  const paginatedData = filteredData.slice(pagination.startIndex, pagination.startIndex + itemsPerPage)

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter?.value])

  const hasFilters = Boolean(searchTerm || (statusFilter && statusFilter.value !== "todos"))
  const defaultEmptyMessage = getEmptyStateMessage(hasFilters, "item")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {searchFields.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-80"
                />
              </div>
            )}
            {statusFilter && (
              <Select value={statusFilter.value} onValueChange={statusFilter.onChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar..." />
                </SelectTrigger>
                <SelectContent>
                  {statusFilter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {emptyStateMessage || defaultEmptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {pagination.startIndex + 1} a {pagination.endIndex} de {filteredData.length} itens
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={pagination.isFirstPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center space-x-1">
                {getPaginationPages(currentPage, pagination.totalPages).map((page, index) => (
                  <div key={`${page}-${index}`} className="flex items-center">
                    {page === -1 || page === -2 ? (
                      <span className="px-2">...</span>
                    ) : (
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={pagination.isLastPage}
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
