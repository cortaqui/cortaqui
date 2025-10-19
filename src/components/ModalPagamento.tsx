"use client"

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
import { CreditCard, DollarSign } from 'lucide-react'
import type { Agendamento } from "~/lib/types"

interface ModalPagamentoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento | null
  onPagamentoRealizado: () => void
}

export function ModalPagamento({
  open,
  onOpenChange,
  agendamento,
  onPagamentoRealizado: _onPagamentoRealizado
}: ModalPagamentoProps) {
  const [loading, setLoading] = useState(false)

  const handlePagar = async () => {
    if (!agendamento) return

    setLoading(true)
    try {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const product = {
        externalId: agendamento.id,
        name: agendamento.servico?.nome ?? 'Serviço',
        description: agendamento.servico?.descricao ?? 'Pagamento de serviço',
        quantity: 1,
        price: Math.round(agendamento.preco_final * 100),
      }
      const customer = agendamento.cliente ? {
        name: agendamento.cliente.nome,
        email: agendamento.cliente.email,
        cellphone: agendamento.cliente.telefone ?? '',
        taxId: '123.456.789-01', // Adicione um valor padrão ou solicite ao cliente
      } : undefined

      const res = await fetch('/api/payments/abacate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [product],
          customer,
          returnUrl: siteUrl,
          completionUrl: `${siteUrl}/meus-agendamentos`,
          metadata: { agendamentoId: agendamento.id },
        })
      })
      const jsonUnknown: unknown = await res.json()
      console.log(jsonUnknown)

      type CreateBillingResponse = { data?: { url?: string | null } | null; error?: string | null }
      const isCreateBillingResponse = (v: unknown): v is CreateBillingResponse => {
        if (typeof v !== 'object' || v === null) return false
        const obj = v as Record<string, unknown>
        const data = obj.data
        const error = obj.error
        const validError = error === undefined || error === null || typeof error === 'string'
        const validData =
          data === undefined || data === null ||
          (typeof data === 'object' && ('url' in (data as Record<string, unknown>) ?
            ((data as Record<string, unknown>).url === undefined || (data as Record<string, unknown>).url === null || typeof (data as Record<string, unknown>).url === 'string') : true))
        return validError && validData
      }

      if (!isCreateBillingResponse(jsonUnknown)) {
        throw new Error('Resposta inesperada do servidor')
      }

      const responseError = jsonUnknown.error ?? undefined
      if (!res.ok || responseError !== undefined) {
        throw new Error(responseError ?? 'Falha ao criar pagamento')
      }

      const url = jsonUnknown.data?.url ?? undefined
      if (typeof url === 'string' && url) {
        window.location.href = url
      } else {
        throw new Error('URL de pagamento não retornada')
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }


  if (!agendamento) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagamento do Serviço
          </DialogTitle>
          <DialogDescription>
            Realize o pagamento do serviço realizado
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <p><strong>Serviço:</strong> {agendamento.servico?.nome}</p>
            <p><strong>Barbeiro:</strong> {agendamento.barbeiro?.nome}</p>
            <p><strong>Data:</strong> {agendamento.data_hora.toLocaleDateString("pt-BR")}</p>
            <p><strong>Horário:</strong> {agendamento.data_hora.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit"
            })}</p>
          </div>

          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total a Pagar:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  R$ {agendamento.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            {/* <p>• Pagamento seguro via gateway integrado</p> */}
            {/* <p>• Aceita cartão de crédito e débito</p> */}
            {/* <p>• Comprovante enviado por email</p> */}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handlePagar} disabled={loading}>
            {loading ? "Processando..." : "Pagar Agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
