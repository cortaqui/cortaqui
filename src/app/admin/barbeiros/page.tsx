"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "~/components/ui/button"
import { Plus } from "lucide-react"
import type { Usuario } from "~/lib/types"
import { ModalAdicionarBarbeiro } from "~/components/ModalAdicionarBarbeiro"
import { ModalEditarBarbeiro, type EditBarbeiroData } from "~/components/ModalEditarBarbeiro"
import { ModalConfirmar } from "~/components/ModalConfirmar"
import { PageHeader } from "~/components/PageHeader"
import { BarbeirosDataTable } from "~/components/tables/BarbeirosDataTable"

export default function BarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState<Usuario[]>([])
  const [modalAdicionarOpen, setModalAdicionarOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<EditBarbeiroData | undefined>(undefined)

  // TODO: Buscar dados de /api/admin/barbeiros
  async function loadBarbeiros() {
    try {
      const res = await fetch('/api/admin/barbeiros')
      if (!res.ok) return
      const rows = (await res.json()) as Array<{
        userId: string
        nome: string
        email: string
        telefone?: string | null
        dataCadastro?: string | null
        updatedAt?: string | null
        deletedAt?: string | null
      }>
      const mapped: Usuario[] = rows.map((r) => ({
        id: r.userId,
        clerk_user_id: '',
        nome: r.nome,
        email: r.email,
        telefone: r.telefone ?? '',
        tipo: 'barbeiro',
        created_at: r.dataCadastro ? new Date(r.dataCadastro) : new Date(),
        updated_at: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        deleted_at: r.deletedAt ? new Date(r.deletedAt) : undefined,
      }))
      setBarbeiros(mapped)
    } catch {}
  }

  // initial load + periodic refresh
  const intervalRef = useRef<number | null>(null)
  useEffect(() => {
    void loadBarbeiros()
    intervalRef.current = window.setInterval(() => { void loadBarbeiros() }, 30000)
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current) }
  }, [])

  const handleExcluirBarbeiro = async (id: string) => {
    setSelected({ id, nome: '', telefone: '' })
    setConfirmOpen(true)
    // The actual delete is handled by confirm modal action
  }

  const handleEditarBarbeiro = (barbeiro: Usuario) => {
    setSelected({ id: barbeiro.id, nome: barbeiro.nome, telefone: barbeiro.telefone })
    setEditarOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Barbeiros"
        description="Gerencie os barbeiros da equipe"
        action={
          <Button onClick={() => setModalAdicionarOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Barbeiro
          </Button>
        }
      />

      <BarbeirosDataTable
        barbeiros={barbeiros}
        title="Lista de Barbeiros"
        description="Todos os barbeiros cadastrados no sistema"
        onEdit={handleEditarBarbeiro}
        onDelete={handleExcluirBarbeiro}
      />

      <ModalAdicionarBarbeiro
        open={modalAdicionarOpen}
        onOpenChange={setModalAdicionarOpen}
        onBarbeiroAdicionado={(novoBarbeiro) => {
          setBarbeiros([...barbeiros, novoBarbeiro])
          setModalAdicionarOpen(false)
          void loadBarbeiros()
        }}
      />

      <ModalEditarBarbeiro
        open={editarOpen}
        onOpenChange={setEditarOpen}
        barbeiro={selected}
        onSaved={(d) => {
          setBarbeiros((prev) => prev.map((b) => (b.id === d.id ? { ...b, nome: d.nome, telefone: d.telefone ?? '' } : b)))
          void loadBarbeiros()
        }}
      />

      <ModalConfirmar
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        titulo="Confirmar exclusão"
        descricao="Tem certeza que deseja excluir este barbeiro?"
        onConfirmar={async () => {
          if (!selected) return
          try {
            const res = await fetch(`/api/admin/barbeiros/${selected.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Falha ao excluir')
            setBarbeiros((prev) => prev.filter((b) => b.id !== selected.id))
            setConfirmOpen(false)
            setSelected(undefined)
            void loadBarbeiros()
          } catch {}
        }}
      />
    </div>
  )
}
