"use client"

import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Plus } from "lucide-react"
import type { Servico } from "~/lib/types"
import { ModalAdicionarServico } from "~/components/ModalAdicionarServico"
import { ModalEditarServico } from "~/components/ModalEditarServico"
import { ModalAdicionarServicoEspecifico } from "~/components/ModalAdicionarServicoEspecifico"
import { ModalConfirmar } from "~/components/ModalConfirmar"
import { PageHeader } from "~/components/PageHeader"
import { ServicosDataTable } from "~/components/tables/ServicosDataTable"
import { ServicosEspecificosList } from "~/components/ServicosEspecificosList"

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [modalAdicionarOpen, setModalAdicionarOpen] = useState(false)
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [servicoEditando, setServicoEditando] = useState<Servico | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toDelete, setToDelete] = useState<Servico | null>(null)
  const [addSpecificOpen, setAddSpecificOpen] = useState(false)
  const [specificRefresh, setSpecificRefresh] = useState(0)

  // Map DB row -> UI Servico
  type AdminServicoRow = {
    servicoId?: string
    id?: string
    nome: string
    descricao?: string | null
    duracaoMinutos?: number
    duracao_minutos?: number
    precoBase?: string | number
    preco_base?: string | number
    ativo: boolean
    createdAt?: string | Date
    created_at?: string | Date
    updatedAt?: string | Date
    updated_at?: string | Date
  }

  function mapRow(row: AdminServicoRow): Servico {
    return {
      id: row.servicoId ?? row.id ?? "",
      nome: row.nome,
      descricao: row.descricao ?? undefined,
      duracao_minutos: Number(row.duracaoMinutos ?? row.duracao_minutos ?? 0),
      preco_base: Number(row.precoBase ?? row.preco_base ?? 0),
      ativo: Boolean(row.ativo),
      created_at: new Date(row.createdAt ?? row.created_at ?? row.updatedAt ?? row.updated_at ?? Date.now()),
      updated_at: new Date(row.updatedAt ?? row.updated_at ?? Date.now()),
    }
  }

  // Load list
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/servicos", { cache: "no-store" })
        if (!res.ok) return
        const rows = (await res.json()) as unknown as AdminServicoRow[]
        if (!mounted) return
        setServicos(rows.map(mapRow))
      } catch {}
    })()
    return () => {
      mounted = false
    }
  }, [])

  const handleEditarServico = (servico: Servico) => {
    setServicoEditando(servico)
    setModalEditarOpen(true)
  }

  const handleExcluirServico = (id: string) => {
    const s = servicos.find((x) => x.id === id) ?? null
    setToDelete(s)
    setConfirmOpen(true)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <PageHeader
        title="Serviços"
        description="Gerencie os serviços oferecidos pela barbearia"
        action={
          <div className="flex gap-2">
            <Button onClick={() => setAddSpecificOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço Específico
            </Button>
            <Button onClick={() => setModalAdicionarOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </div>
        }
      />

      <ServicosDataTable
        servicos={servicos}
        title="Lista de Serviços"
        description="Todos os serviços cadastrados no sistema"
        onEdit={handleEditarServico}
        onDelete={handleExcluirServico}
      />

      <ModalAdicionarServico
        open={modalAdicionarOpen}
        onOpenChange={setModalAdicionarOpen}
        onServicoAdicionado={(novoServico) => {
          setServicos([...servicos, novoServico])
          setModalAdicionarOpen(false)
        }}
      />

      <ModalEditarServico
        open={modalEditarOpen}
        onOpenChange={setModalEditarOpen}
        servico={servicoEditando}
        onServicoEditado={(servicoEditado) => {
          setServicos(servicos.map((s) => (s.id === servicoEditado.id ? servicoEditado : s)))
          setModalEditarOpen(false)
          setServicoEditando(null)
        }}
      />

      <ModalAdicionarServicoEspecifico
        open={addSpecificOpen}
        onOpenChange={setAddSpecificOpen}
        onSaved={() => { setSpecificRefresh((v) => v + 1) }}
      />

      <ModalConfirmar
        open={confirmOpen}
        onOpenChange={(o) => {
          setConfirmOpen(o)
          if (!o) setToDelete(null)
        }}
        titulo="Excluir serviço"
        descricao="Esta ação não pode ser desfeita. Deseja continuar?"
        loading={deleting}
        onConfirmar={async () => {
          if (!toDelete) return
          setDeleting(true)
          try {
            const resp = await fetch(`/api/admin/servicos/${encodeURIComponent(toDelete.id)}`, { method: "DELETE" })
            if (resp.ok) {
              setServicos((cur) => cur.filter((s) => s.id !== toDelete.id))
            }
          } finally {
            setDeleting(false)
            setConfirmOpen(false)
            setToDelete(null)
          }
        }}
      />
      <ServicosEspecificosList refreshKey={specificRefresh} />
    </div>
  )
}
