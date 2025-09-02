"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
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

export function ServicosEspecificosList({ refreshKey }: { refreshKey?: number }) {
  const [rows, setRows] = useState<Row[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function loadAll() {
    // For simplicity, list all by not passing barbeiroId; API will currently require it, so fallback to none
    const res = await fetch("/api/admin/servicos/barbeiro")
    if (!res.ok) { setRows([]); return }
    const data = (await res.json()) as Row[]
    setRows(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    void loadAll()
  }, [refreshKey])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Serviços Específicos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Barbeiro</TableHead>
                <TableHead>Preço Específico</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">Nenhum serviço específico cadastrado.</TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={`${r.barbeiroUserId}-${r.servicoId}`}>
                  <TableCell>{r.servicoNome ?? r.servicoId}</TableCell>
                  <TableCell>{r.barbeiroNome ?? r.barbeiroUserId}</TableCell>
                  <TableCell>R$ {Number(r.precoEspecifico ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
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
