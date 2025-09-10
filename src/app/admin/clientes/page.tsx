"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Usuario } from "~/lib/types"
import { PageHeader } from "~/components/PageHeader"
import { ClientesDataTable } from "~/components/tables/ClientesDataTable"
import { ModalEditarCliente, type EditClienteData } from "~/components/ModalEditarCliente"
import { ModalConfirmar } from "~/components/ModalConfirmar"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Usuario[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [editarOpen, setEditarOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selected, setSelected] = useState<EditClienteData | undefined>(undefined)

  async function loadClientes() {
    try {
      const res = await fetch('/api/admin/clientes')
      if (!res.ok) return
      const rowsUnknown: unknown = await res.json()
      const rows = (Array.isArray(rowsUnknown) ? rowsUnknown : []).map((r) => {
        const obj = r as Record<string, unknown>
        const userId = typeof obj.userId === 'string' ? obj.userId : ''
        const nome = typeof obj.nome === 'string' ? obj.nome : ''
        const email = typeof obj.email === 'string' ? obj.email : ''
        const telefone = typeof obj.telefone === 'string' ? obj.telefone : null
        const dataCadastro = typeof obj.dataCadastro === 'string' ? obj.dataCadastro : null
        const updatedAt = typeof obj.updatedAt === 'string' ? obj.updatedAt : null
        const deletedAt = typeof obj.deletedAt === 'string' ? obj.deletedAt : null
        return { userId, nome, email, telefone, dataCadastro, updatedAt, deletedAt }
      }) as Array<{
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
        tipo: 'cliente',
        created_at: r.dataCadastro ? new Date(r.dataCadastro) : new Date(),
        updated_at: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        deleted_at: r.deletedAt ? new Date(r.deletedAt) : undefined,
      }))
      setClientes(mapped)
    } catch {}
  }

  const fetchCounts = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        clientes.map(async (c) => {
          const res = await fetch(`/api/admin/agendamentos/count?clienteId=${encodeURIComponent(c.id)}`)
          if (!res.ok) return { id: c.id, count: 0 }
          const jsonUnknown: unknown = await res.json()
          const obj = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as Record<string, unknown>) : {}
          const count = typeof obj.count === 'number' ? obj.count : 0
          return { id: c.id, count }
        })
      )
      const next: Record<string, number> = {}
      for (const r of results) {
        if (r.status === 'fulfilled') {
          next[r.value.id] = r.value.count
        }
      }
      if (Object.keys(next).length > 0) setCounts(next)
    } catch {}
  }, [clientes])

  const intervalRef = useRef<number | null>(null)
  useEffect(() => {
    void loadClientes()
    intervalRef.current = window.setInterval(() => { void loadClientes() }, 30000)
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current) }
  }, [])

  // Fetch counts whenever clientes list changes
  useEffect(() => {
    if (clientes.length > 0) {
      void fetchCounts()
    } else {
      setCounts({})
    }
  }, [clientes, fetchCounts])

  const handleViewClienteDetails = (cliente: Usuario) => {
    setSelected({ id: cliente.id, nome: cliente.nome, telefone: cliente.telefone })
    setEditarOpen(true)
  }



  const getAgendamentosCount = (clienteId: string) => {
    const val = counts[clienteId]
    return typeof val === 'number' ? val : 0
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Clientes"
        description="Visualize todos os clientes cadastrados"
      />

      <ClientesDataTable
        clientes={clientes}
        title="Lista de Clientes"
        description="Todos os clientes cadastrados no sistema"
        onEdit={handleViewClienteDetails}
        onDelete={async (id) => {
          setSelected({ id: String(id), nome: '', telefone: '' })
          setConfirmOpen(true)
        }}
        getAgendamentosCount={getAgendamentosCount}
      />
      <ModalConfirmar
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        titulo="Confirmar exclusão"
        descricao="Tem certeza que deseja excluir este cliente?"
        onConfirmar={async () => {
          if (!selected) return
          try {
            const res = await fetch(`/api/admin/clientes/${selected.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Falha ao excluir')
            setClientes((prev) => prev.filter((c) => c.id !== selected.id))
            setConfirmOpen(false)
            setSelected(undefined)
            void loadClientes()
          } catch {}
        }}
      />

      <ModalEditarCliente
        open={editarOpen}
        onOpenChange={setEditarOpen}
        cliente={selected}
        onSaved={(d) => {
          setClientes((prev) => prev.map((c) => (c.id === d.id ? { ...c, nome: d.nome, telefone: d.telefone ?? '' } : c)))
          void loadClientes()
        }}
      />
    </div>
  )
}
