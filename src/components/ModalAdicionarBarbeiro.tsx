"use client"

import type React from "react"

import { useEffect, useState } from "react"
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
import { Autocomplete, type Suggestion } from "~/components/Autocomplete"

type CreateResponse = {
  userId?: string
  id?: string
  nome?: string
  email?: string
  telefone?: string
  dataCadastro?: string
  updatedAt?: string
}

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
  const [clerkUserId, setClerkUserId] = useState<string | undefined>(undefined)
  const [manual, setManual] = useState(false)
  const [sendInvite, setSendInvite] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setManual(false)
      setSendInvite(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Validate unique name across users and services
      setNameError(null)
      const chk = await fetch(`/api/admin/names/exists?name=${encodeURIComponent(nome)}`)
      if (chk.ok) {
        const j = await chk.json() as { exists?: boolean; in?: string | null }
        if (j.exists) {
          setNameError("Já existe um registro com este nome")
          setLoading(false)
          return
        }
      }
      const res = await fetch('/api/admin/barbeiros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone, clerkUserId, sendInvite: manual ? sendInvite : undefined }),
      })
      if (!res.ok) throw new Error('Falha ao criar barbeiro')
      const rowJson = (await res.json()) as unknown
      const row: CreateResponse = (rowJson && typeof rowJson === 'object' ? rowJson as CreateResponse : {})
      const novoBarbeiro: Usuario = {
        id: row.userId ?? row.id ?? crypto.randomUUID(),
        clerk_user_id: clerkUserId ?? '',
        nome: row.nome ?? nome,
        email: row.email ?? email,
        telefone: row.telefone ?? telefone,
        tipo: 'barbeiro',
        created_at: row.dataCadastro ? new Date(row.dataCadastro) : new Date(),
        updated_at: row.updatedAt ? new Date(row.updatedAt) : new Date(),
      }
      onBarbeiroAdicionado(novoBarbeiro)
      // limpar
      setNome("")
      setEmail("")
      setTelefone("")
      setClerkUserId(undefined)
      setManual(false)
      setSendInvite(false)
      onOpenChange(false)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  function formatPhone(input: string) {
    const digits = input.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
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
            <Autocomplete
              value={nome}
              onChange={(v: string) => { setNome(v); setClerkUserId(undefined) }}
              onSelect={(s: Suggestion) => {
                setNome(s.name)
                setEmail(s.email ?? '')
                setTelefone(s.phone ?? '')
                setClerkUserId(s.id)
                setManual(false)
              }}
              searchApi="/api/admin/clientes/search"
              label="Nome Completo"
              placeholder="João Silva"
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            <div className="flex items-center gap-2">
              <input id="add-manual" type="checkbox" className="h-4 w-4" checked={manual} onChange={(e) => { setManual(e.target.checked); if (e.target.checked) { setClerkUserId(undefined) } }} />
              <label htmlFor="add-manual" className="text-sm">Adicionar manualmente</label>
            </div>
            {clerkUserId && !manual && (
              <p className="text-xs text-muted-foreground">Usuário encontrado no sistema. Campos preenchidos automaticamente.</p>
            )}

            {manual && (
              <>
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
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input id="send-invite" type="checkbox" className="h-4 w-4" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} />
                  <label htmlFor="send-invite" className="text-sm">Enviar convite via email</label>
                </div>
              </>
            )}
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
