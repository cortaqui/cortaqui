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
import { Textarea } from "~/components/ui/textarea"
import { Switch } from "~/components/ui/switch"
import type { Servico } from "~/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"

interface ModalAdicionarServicoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onServicoAdicionado: (servico: Servico) => void
}

export function ModalAdicionarServico({ open, onOpenChange, onServicoAdicionado }: ModalAdicionarServicoProps) {
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [duracaoMinutos, setDuracaoMinutos] = useState("")
  const [precoBase, setPrecoBase] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Enviar para /api/servicos
    const novoServico: Servico = {
      id: Math.random().toString(36).substr(2, 9),
      nome,
      descricao: descricao || undefined,
      duracao_minutos: Number.parseInt(duracaoMinutos),
      preco_base: Number.parseFloat(precoBase),
      ativo,
      created_at: new Date(),
      updated_at: new Date(),
    }

    onServicoAdicionado(novoServico)

    // Limpar formulário
    setNome("")
    setDescricao("")
    setDuracaoMinutos("")
    setPrecoBase("")
    setAtivo(true)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Serviço</DialogTitle>
          <DialogDescription>Preencha as informações do novo serviço que será oferecido.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Serviço</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Corte Masculino"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o serviço..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duracao">Duração (min)</Label>
                <Select value={duracaoMinutos} onValueChange={setDuracaoMinutos} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60, 75, 90, 105, 120].map((minutos) => (
                      <SelectItem key={minutos} value={minutos.toString()}>
                        {minutos} minutos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preco">Preço Base (R$)</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={precoBase}
                  onChange={(e) => setPrecoBase(e.target.value)}
                  placeholder="25.00"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
              <Label htmlFor="ativo">Serviço ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Serviço"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
