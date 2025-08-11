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
import { AlertTriangle } from 'lucide-react'
import type { Agendamento } from "~/lib/types"

interface ModalCancelarAgendamentoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agendamento: Agendamento | null
  onAgendamentoCancelado: () => void
}

export function ModalCancelarAgendamento({ 
  open, 
  onOpenChange, 
  agendamento, 
  onAgendamentoCancelado 
}: ModalCancelarAgendamentoProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirmarCancelamento = async () => {
    if (!agendamento) return

    setLoading(true)
    
    // TODO: Enviar para /api/agendamentos/[id]/cancelar
    console.log("Cancelando agendamento:", agendamento.id)
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    onAgendamentoCancelado()
    setLoading(false)
  }

  if (!agendamento) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancelar Agendamento
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
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
            <p><strong>Valor:</strong> R$ {agendamento.preco_final.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Voltar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirmarCancelamento}
            disabled={loading}
          >
            {loading ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
