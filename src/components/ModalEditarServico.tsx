"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface ModalEditarServicoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  servico: Servico | null
  onServicoEditado: (servico: Servico) => void
}

export function ModalEditarServico({ open, onOpenChange, servico, onServicoEditado }: ModalEditarServicoProps) {
  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [duracaoMinutos, setDuracaoMinutos] = useState("")
  const [precoBase, setPrecoBase] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (servico) {
      setNome(servico.nome)
      setDescricao(servico.descricao || "")
      setDuracaoMinutos(servico.duracao_minutos.toString())
      setPrecoBase(servico.preco_base.toString())
      setAtivo(servico.ativo)
    }
  }, [servico])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!servico) return

    setLoading(true)

    // TODO: Enviar para /api/servicos/[id]
    const servicoEditado: Servico = {
      ...servico,
      nome,
      descricao: descricao || undefined,
      duracao_minutos: Number.parseInt(duracaoMinutos),
      preco_base: Number.parseFloat(precoBase),
      ativo,
      updated_at: new Date(),
    }

    onServicoEditado(servicoEditado)
    setLoading(false)
  }

  if (!servico) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
          <DialogDescription>Altere as informações do serviço.</DialogDescription>
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
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
