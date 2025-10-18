"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Input } from "~/components/ui/input"
import { Pencil, Trash2, Scissors } from "lucide-react"
import { ModalEditarServicoEspecifico } from "~/components/ModalEditarServicoEspecifico"
import { ModalConfirmar } from "~/components/ModalConfirmar"

type Row = {
  barbeiroUserId: string
  servicoId: string
  precoEspecifico: string | null
  updatedAt: string | Date
  servicoNome?: string
  barbeiroNome?: string
}

export function PrecosEspecificosDataTable({ refreshKey }: { refreshKey?: number }) {
  const [rows, setRows] = useState<Row[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  async function loadAll() {
    const res = await fetch("/api/admin/servicos/barbeiro", { cache: "no-store" })
    if (!res.ok) { setRows([]); return }
    const data = (await res.json()) as Row[]
    const filtered = (Array.isArray(data) ? data : []).filter((r) => r.precoEspecifico !== null)
    setRows(filtered)
  }

  useEffect(() => {
    void loadAll()
  }, [refreshKey])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => (r.servicoNome ?? "").toLowerCase().includes(q) || (r.barbeiroNome ?? "").toLowerCase().includes(q))
  }, [rows, searchTerm])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const pageRows = filtered.slice(startIndex, startIndex + itemsPerPage)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Preços Específicos
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Buscar serviço ou barbeiro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
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
                <TableHead>Serviço</TableHead>
                <TableHead>Barbeiro</TableHead>
                <TableHead className="text-right">Preço Específico</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Nenhum preço específico cadastrado.</TableCell>
                </TableRow>
              ) : pageRows.map((r) => (
                <TableRow key={`${r.barbeiroUserId}-${r.servicoId}`}>
                  <TableCell>{r.servicoNome ?? r.servicoId}</TableCell>
                  <TableCell>{r.barbeiroNome ?? r.barbeiroUserId}</TableCell>
                  <TableCell className="text-right">R$ {Number(r.precoEspecifico ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditing(r); setEditOpen(true) }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setEditing(r); setConfirmOpen(true) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filtered.length)} de {filtered.length} preços específicos
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}

        {editing && (
          <ModalEditarServicoEspecifico
            open={editOpen}
            onOpenChange={setEditOpen}
            barbeiroUserId={editing.barbeiroUserId}
            servicoId={editing.servicoId}
            precoAtual={editing.precoEspecifico ?? 0}
            onSaved={() => { void loadAll() }}
          />
        )}

        <ModalConfirmar
          open={confirmOpen}
          onOpenChange={(o) => { setConfirmOpen(o); if (!o) setEditing(null) }}
          titulo="Excluir serviço específico"
          descricao="Esta ação não pode ser desfeita. Deseja continuar?"
          loading={deleting}
          onConfirmar={async () => {
            if (!editing) return
            setDeleting(true)
            try {
              await fetch(`/api/admin/servicos/barbeiro?barbeiroUserId=${encodeURIComponent(editing.barbeiroUserId)}&servicoId=${encodeURIComponent(editing.servicoId)}`, { method: 'DELETE' })
              await loadAll()
            } finally {
              setDeleting(false)
              setConfirmOpen(false)
              setEditing(null)
            }
          }}
        />
      </CardContent>
    </Card>
  )
}
