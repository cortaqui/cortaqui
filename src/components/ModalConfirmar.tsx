"use client"

import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { AlertTriangle } from "lucide-react"

interface ModalConfirmarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  descricao: string
  onConfirmar: () => void
  loading?: boolean
}

export function ModalConfirmar({
  open,
  onOpenChange,
  titulo,
  descricao,
  onConfirmar,
  loading = false,
}: ModalConfirmarProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {titulo}
          </DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirmar} disabled={loading}>
            {loading ? "Excluindo..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
