"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Autocomplete, type Suggestion } from "~/components/Autocomplete"

export function ModalAdicionarServicoEspecifico({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [servicoNome, setServicoNome] = useState("")
  const [servicoId, setServicoId] = useState<string>("")
  const [barbeiroNome, setBarbeiroNome] = useState("")
  const [barbeiroId, setBarbeiroId] = useState<string>("")
  const [preco, setPreco] = useState("")
  const [loading, setLoading] = useState(false)

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
    if (!servicoId || !barbeiroId) return
    setLoading(true)
    try {
      const precoForApi = preco.replace(/\./g, "").replace(",", ".")
      const resp = await fetch("/api/admin/servicos/barbeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barbeiroUserId: barbeiroId, servicoId, precoEspecifico: precoForApi }),
      })
      if (!resp.ok) throw new Error("Erro ao salvar")
      onSaved()
      onOpenChange(false)
      setServicoNome("")
      setServicoId("")
      setBarbeiroNome("")
      setBarbeiroId("")
      setPreco("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Adicionar Serviço Específico</DialogTitle>
          <DialogDescription>Associe um serviço a um barbeiro com preço específico.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Autocomplete
              value={servicoNome}
              onChange={setServicoNome}
              onSelect={(s: Suggestion) => { setServicoNome(s.name); setServicoId(s.id) }}
              searchApi="/api/admin/servicos/search"
              label="Serviço"
              placeholder="Digite para buscar o serviço"
            />
            <Autocomplete
              value={barbeiroNome}
              onChange={setBarbeiroNome}
              onSelect={async (s: Suggestion) => {
                setBarbeiroNome(s.name)
                try {
                  const resp = await fetch(`/api/usuarios?email=${encodeURIComponent(s.email ?? "")}`)
                  if (!resp.ok) return
                  const user = (await resp.json()) as { userId: string }
                  setBarbeiroId(user.userId)
                } catch {}
              }}
              searchApi="/api/admin/barbeiros/search"
              label="Barbeiro"
              placeholder="Digite para buscar o barbeiro"
            />
            <div className="grid gap-2">
              <Label htmlFor="preco">Preço Específico (R$)</Label>
              <Input id="preco" inputMode="decimal" value={preco} onChange={(e) => setPreco(sanitizePrecoInput(e.target.value))} placeholder="25,00" required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading || !servicoId || !barbeiroId}>{loading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
