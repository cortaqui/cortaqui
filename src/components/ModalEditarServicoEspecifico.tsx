"use client"

import { useEffect, useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

export function ModalEditarServicoEspecifico({
  open,
  onOpenChange,
  barbeiroUserId,
  servicoId,
  precoAtual,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  barbeiroUserId: string
  servicoId: string
  precoAtual: string | number
  onSaved: () => void
}) {
  const [preco, setPreco] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const val = typeof precoAtual === 'number' ? precoAtual.toFixed(2) : String(precoAtual)
    setPreco(val.replace('.', ','))
  }, [precoAtual])

  function sanitizePrecoInput(value: string): string {
    let v = value.replace(/[^\d,\. ,]/g, "").replace(/\s+/g, "")
    v = v.replace(/\./g, ",")
    const firstComma = v.indexOf(",")
    if (firstComma !== -1) v = v.slice(0, firstComma + 1) + v.slice(firstComma + 1).replace(/,/g, "")
    if (v.startsWith(",") && v.length > 1) v = `0${v}`
    return v
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const precoForApi = preco.replace(/\./g, "").replace(",", ".")
      const resp = await fetch("/api/admin/servicos/barbeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barbeiroUserId, servicoId, precoEspecifico: precoForApi }),
      })
      if (!resp.ok) throw new Error("Erro ao salvar")
      onSaved()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Editar Preço Específico</DialogTitle>
          <DialogDescription>Atualize o preço específico deste serviço para o barbeiro.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input id="preco" inputMode="decimal" value={preco} onChange={(e) => setPreco(sanitizePrecoInput(e.target.value))} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
