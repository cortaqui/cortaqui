"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, Users } from "lucide-react"
import type { Usuario } from "~/lib/types"

interface BarbeirosDataTableProps {
  barbeiros: Usuario[]
  title?: string
  description?: string
  onEdit?: (barbeiro: Usuario) => void
  onDelete?: (barbeiroId: string) => void
}

export function BarbeirosDataTable({ 
  barbeiros, 
  title = "Lista de Barbeiros",
  description,
  onEdit,
  onDelete
}: BarbeirosDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter barbeiros based on search
  const filteredBarbeiros = useMemo(() => {
    return barbeiros.filter((barbeiro) => {
      const matchesSearch = (searchTerm === "" ||
        barbeiro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barbeiro.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barbeiro.telefone.includes(searchTerm))

      return matchesSearch
    })
  }, [barbeiros, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredBarbeiros.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBarbeiros = filteredBarbeiros.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </CardTitle>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-80"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBarbeiros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm 
                      ? "Nenhum barbeiro encontrado com os filtros aplicados." 
                      : "Nenhum barbeiro encontrado."
                    }
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBarbeiros.map((barbeiro) => (
                  <TableRow key={barbeiro.id}>
                    <TableCell className="font-medium">{barbeiro.nome}</TableCell>
                    <TableCell>{barbeiro.email}</TableCell>
                    <TableCell>{barbeiro.telefone}</TableCell>
                    <TableCell>{barbeiro.created_at.toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onEdit(barbeiro)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => onDelete(barbeiro.id)}
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
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredBarbeiros.length)} de {filteredBarbeiros.length} barbeiros
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