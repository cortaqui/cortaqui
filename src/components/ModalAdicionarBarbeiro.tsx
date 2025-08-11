"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import type { Usuario } from "~/lib/types"

interface ModalAdicionarBarbeiroProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBarbeiroAdicionado: (barbeiro: Usuario) => void
}

export function ModalAdicionarBarbeiro({ open, onOpenChange, onBarbeiroAdicionado }: ModalAdicionarBarbeiroProps) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Enviar para /api/admin/barbeiros
    const novoBarbeiro: Usuario = {
      id: Math.random().toString(36).substr(2, 9),
      clerk_user_id: `clerk_barbeiro_${Math.random().toString(36).substr(2, 9)}`,
      nome,
      email,
      telefone,
      tipo: "barbeiro",
      created_at: new Date(),
      updated_at: new Date(),
    }

    onBarbeiroAdicionado(novoBarbeiro)

    // Limpar formulário
    setNome("")
    setEmail("")
    setTelefone("")
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Barbeiro</DialogTitle>
          <DialogDescription>Preencha as informações do novo barbeiro da equipe.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@cortaqui.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar Barbeiro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
