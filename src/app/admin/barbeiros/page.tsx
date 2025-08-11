"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getBarbeiros } from "~/lib/mock-data"
import type { Usuario } from "~/lib/types"
import { ModalAdicionarBarbeiro } from "~/components/ModalAdicionarBarbeiro"

export default function BarbeirosPage() {
  const [barbeiros, setBarbeiros] = useState<Usuario[]>(getBarbeiros())
  const [modalAdicionarOpen, setModalAdicionarOpen] = useState(false)

  // TODO: Buscar dados de /api/admin/barbeiros

  const handleExcluirBarbeiro = (id: string) => {
    // TODO: Implementar exclusão via API
    setBarbeiros(barbeiros.filter((b) => b.id !== id))
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Barbeiros</h1>
          <p className="text-muted-foreground">Gerencie os barbeiros da equipe</p>
        </div>
        <Button onClick={() => setModalAdicionarOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Barbeiro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Barbeiros</CardTitle>
          <CardDescription>Todos os barbeiros cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
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
              {barbeiros.map((barbeiro) => (
                <TableRow key={barbeiro.id}>
                  <TableCell className="font-medium">{barbeiro.nome}</TableCell>
                  <TableCell>{barbeiro.email}</TableCell>
                  <TableCell>{barbeiro.telefone}</TableCell>
                  <TableCell>{barbeiro.created_at.toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExcluirBarbeiro(barbeiro.id)}>
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

      <ModalAdicionarBarbeiro
        open={modalAdicionarOpen}
        onOpenChange={setModalAdicionarOpen}
        onBarbeiroAdicionado={(novoBarbeiro) => {
          setBarbeiros([...barbeiros, novoBarbeiro])
          setModalAdicionarOpen(false)
        }}
      />
    </div>
  )
}
