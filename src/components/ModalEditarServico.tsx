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
import { Autocomplete, type Suggestion } from "~/components/Autocomplete"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"

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
  const [nameError, setNameError] = useState<string | null>(null)
  const [barbeiroQuery, setBarbeiroQuery] = useState("")
  const [selectedBarbeiros, setSelectedBarbeiros] = useState<Array<{ id: string; nome: string }>>([])

  useEffect(() => {
    if (servico) {
      setNome(servico.nome)
      setDescricao(servico.descricao ?? "")
      setDuracaoMinutos(servico.duracao_minutos.toString())
      setPrecoBase(Number(servico.preco_base).toFixed(2).replace('.', ','))
      setAtivo(servico.ativo)
      // load associated barbers
      void (async () => {
        try {
          const res = await fetch(`/api/admin/servicos/${encodeURIComponent(servico.id)}/barbeiros`)
          if (!res.ok) return
          const rowsUnknown: unknown = await res.json()
          const rows = Array.isArray(rowsUnknown) ? rowsUnknown as Array<Record<string, unknown>> : []
          const mapped = rows
            .map((r) => ({ id: String((r.id ?? r.userId) as string), nome: String((r.nome ?? r.name) as string) }))
            .filter((b) => !!b.id && !!b.nome)
          setSelectedBarbeiros(mapped)
        } catch {}
      })()
    }
  }, [servico])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!servico) return

    setLoading(true)
    try {
      // Validate unique name across users and services (exclude current service id)
      setNameError(null)
      const chk = await fetch(`/api/admin/names/exists?name=${encodeURIComponent(nome)}&excludeServicoId=${encodeURIComponent(servico.id)}`)
      if (chk.ok) {
        const j = await chk.json() as { exists?: boolean; in?: string | null }
        if (j.exists) {
          setNameError("Já existe um registro com este nome")
          setLoading(false)
          return
        }
      }
      const precoForApi = precoBase.replace(/\./g, "").replace(",", ".")
      const resp = await fetch(`/api/admin/servicos/${encodeURIComponent(servico.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          descricao: descricao || undefined,
          duracaoMinutos: Number.parseInt(duracaoMinutos),
          precoBase: precoForApi,
          ativo,
        }),
      })
      if (!resp.ok) throw new Error("Falha ao salvar serviço")
      const row = (await resp.json()) as unknown as { servicoId: string; nome: string; descricao: string | null; duracaoMinutos: number; precoBase: string | number; ativo: boolean; updatedAt: string | Date }
      const servicoEditado: Servico = {
        id: row.servicoId ?? servico.id,
        nome: row.nome,
        descricao: row.descricao ?? undefined,
        duracao_minutos: Number(row.duracaoMinutos ?? duracaoMinutos),
        preco_base: Number(row.precoBase ?? 0),
        ativo: Boolean(row.ativo),
        created_at: new Date(servico.created_at),
        updated_at: new Date(row.updatedAt),
      }
      // Save associations
      try {
        await fetch(`/api/admin/servicos/${encodeURIComponent(servicoEditado.id)}/barbeiros`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ barbeiroIds: selectedBarbeiros.map((b) => b.id) }),
        })
      } catch {}
      onServicoEditado(servicoEditado)
    } catch {
      // noop: could add toast later
    } finally {
      setLoading(false)
    }
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
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
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
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="grid gap-2 min-w-0">
                <Label htmlFor="duracao">Duração (min)</Label>
                <Select value={duracaoMinutos} onValueChange={setDuracaoMinutos} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 60, 90, 120, 150, 180].map((minutos) => {
                      const horas = Math.floor(minutos / 60)
                      const mins = minutos % 60
                      const label = minutos < 60
                        ? `${minutos} minutos`
                        : `${horas}:${String(mins).padStart(2, '0')} ${horas === 1 ? 'hora' : 'horas'}`
                      return (
                        <SelectItem key={minutos} value={minutos.toString()}>
                          {label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 min-w-0">
                <Label htmlFor="preco">Preço Base (R$)</Label>
                <Input
                  id="preco"
                  inputMode="decimal"
                  value={precoBase}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^\d,\. ,]/g, "").replace(/\s+/g, "")
                    v = v.replace(/\./g, ",")
                    const firstComma = v.indexOf(",")
                    if (firstComma !== -1) {
                      v = v.slice(0, firstComma + 1) + v.slice(firstComma + 1).replace(/,/g, "")
                    }
                    if (v.startsWith(",") && v.length > 1) v = `0${v}`
                    setPrecoBase(v)
                  }}
                  placeholder="25,00"
                  required
                />
              </div>
            </div>
          {/* Associations */}
          <div className="grid gap-2">
            <Label>Barbeiros que realizam este serviço</Label>
            <Autocomplete
              value={barbeiroQuery}
              onChange={setBarbeiroQuery}
              onSelect={(s: Suggestion) => {
                setBarbeiroQuery("")
                setSelectedBarbeiros((cur) => cur.find((b) => b.id === s.id) ? cur : [...cur, { id: s.id, nome: s.name }])
              }}
              searchApi="/api/admin/barbeiros/search"
              placeholder="Buscar barbeiro para adicionar"
              required={false}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedBarbeiros.map((b) => (
                <div key={b.id} className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs">
                  <Avatar className="h-5 w-5">
                    <AvatarImage />
                    <AvatarFallback>{b.nome?.[0]?.toUpperCase() ?? 'B'}</AvatarFallback>
                  </Avatar>
                  <span>{b.nome}</span>
                  <button
                    type="button"
                    className="rounded-full px-1 hover:bg-accent"
                    onClick={() => setSelectedBarbeiros((cur) => cur.filter((x) => x.id !== b.id))}
                    aria-label={`Remover ${b.nome}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
            </div>
            <div className="flex items-center space-x-2 pb-2">
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
              <Label htmlFor="ativo">Serviço ativo</Label>
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
