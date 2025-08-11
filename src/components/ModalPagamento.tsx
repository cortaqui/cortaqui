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
  onPagamentoRealizado
}: ModalPagamentoProps) {
  const [loading, setLoading] = useState(false)

  const handlePagar = async () => {
    if (!agendamento) return

    setLoading(true)

    // TODO: Integrar com gateway de pagamento (Stripe, PagSeguro, etc.)
    console.log("Processando pagamento para agendamento:", agendamento.id)

    // Simular processamento do pagamento
    await new Promise(resolve => setTimeout(resolve, 2000))

    onPagamentoRealizado()
    setLoading(false)
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
                <DollarSign className="h-5 w-5" />
                <span className="text-2xl font-bold">
                  R$ {agendamento.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>• Pagamento seguro via gateway integrado</p>
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
