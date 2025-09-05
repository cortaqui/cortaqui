"use client"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"

export interface EditBarbeiroData {
  id: string
  nome: string
  telefone?: string
}

export function ModalEditarBarbeiro({
  open,
  onOpenChange,
  barbeiro,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  barbeiro?: EditBarbeiroData
  onSaved: (data: { id: string; nome: string; telefone?: string }) => void
}) {
  const [nome, setNome] = useState(barbeiro?.nome ?? "")
  const [telefone, setTelefone] = useState(barbeiro?.telefone ?? "")
  const [loading, setLoading] = useState(false)

  function formatPhone(input: string) {
    const digits = input.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  }

  async function handleSave() {
    if (!barbeiro) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/barbeiros/${barbeiro.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, telefone }),
      })
      if (!res.ok) throw new Error('Falha ao salvar barbeiro')
      onSaved({ id: barbeiro.id, nome, telefone })
      onOpenChange(false)
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Barbeiro</DialogTitle>
          <DialogDescription>Atualize os dados do barbeiro.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="nome" className="text-sm font-medium">Nome</label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label htmlFor="telefone" className="text-sm font-medium">Telefone</label>
            <Input id="telefone" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
