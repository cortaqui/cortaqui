"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Badge } from "~/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { mockServicos } from "~/lib/mock-data"
import type { Servico } from "~/lib/types"
import { ModalAdicionarServico } from "~/components/ModalAdicionarServico"
import { ModalEditarServico } from "~/components/ModalEditarServico"

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>(mockServicos)
  const [modalAdicionarOpen, setModalAdicionarOpen] = useState(false)
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [servicoEditando, setServicoEditando] = useState<Servico | null>(null)

  // TODO: Buscar dados de /api/servicos

  const handleEditarServico = (servico: Servico) => {
    setServicoEditando(servico)
    setModalEditarOpen(true)
  }

  const handleExcluirServico = (id: string) => {
    // TODO: Implementar exclusão via API
    setServicos(servicos.filter((s) => s.id !== id))
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos pela barbearia</p>
        </div>
        <Button onClick={() => setModalAdicionarOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Serviço
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
          <CardDescription>Todos os serviços cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Duração (min)</TableHead>
                <TableHead>Preço Base</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{servico.nome}</div>
                      {servico.descricao && <div className="text-sm text-muted-foreground">{servico.descricao}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{servico.duracao_minutos}</TableCell>
                  <TableCell>R$ {servico.preco_base.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Badge variant={servico.ativo ? "default" : "secondary"}>
                      {servico.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditarServico(servico)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExcluirServico(servico.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
    </div>
  )
}
