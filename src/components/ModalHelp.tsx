"use client"

import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"

export function ModalHelp({ open, onOpenChange, pathname }: { open: boolean; onOpenChange: (o: boolean) => void; pathname: string }) {
  const { title, body } = useMemo(() => getHelpForPath(pathname), [pathname])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm leading-6">
          {body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getHelpForPath(pathname: string): { title: string; body: string[] } {
  if (pathname.startsWith("/admin/servicos")) {
    return {
      title: "Ajuda • Serviços",
      body: [
        "Aqui você gerencia os serviços gerais da barbearia.",
        "Use o botão Adicionar Serviço para criar um serviço com nome, duração e preço base.",
        "Na edição, use o grupo de chips para escolher quais barbeiros realizam o serviço. Ao criar, todos os barbeiros são associados por padrão.",
        "O campo de busca de barbeiros permite adicionar/remover profissionais do serviço.",
        "Preços específicos por barbeiro substituem o preço base ao agendar. Você os gerencia em ‘Preços Específicos’.",
        "Ao excluir um serviço, suas associações e preços específicos são removidos automaticamente.",
        "A coluna Barbeiros exibe os profissionais associados ao serviço. As mudanças aparecem logo após salvar na edição.",
      ],
    }
  }
  if (pathname.startsWith("/admin/barbeiros")) {
    return {
      title: "Ajuda • Barbeiros",
      body: [
        "Liste e cadastre barbeiros. O cadastro pode convidar/criar usuário no Clerk.",
        "Associações de serviços são feitas na tela de Serviços, dentro do modal de edição.",
        "Ao buscar, você pode filtrar por nome ou e‑mail.",
      ],
    }
  }
  if (pathname.startsWith("/admin/agendamentos")) {
    return {
      title: "Ajuda • Agendamentos",
      body: [
        "Crie e gerencie agendamentos.",
        "Ao selecionar um serviço, somente barbeiros associados aparecem nas sugestões.",
        "Se houver preço específico para o barbeiro, ele substitui o preço base.",
        "Conflitos de horário são checados automaticamente para cliente e barbeiro.",
      ],
    }
  }
  if (pathname.startsWith("/admin/clientes")) {
    return {
      title: "Ajuda • Clientes",
      body: [
        "Gerencie o cadastro de clientes.",
        "Você pode buscar por nome ou e‑mail ao agendar pelo admin.",
      ],
    }
  }
  if (pathname.startsWith("/admin/disponibilidade")) {
    return {
      title: "Ajuda • Disponibilidade",
      body: [
        "Defina horários de trabalho e bloqueios para barbeiros.",
        "Os horários disponíveis para agendamento são calculados a partir dessas regras.",
      ],
    }
  }
  if (pathname.startsWith("/admin/relatorios")) {
    return {
      title: "Ajuda • Relatórios",
      body: [
        "Visualize métricas de agendamentos e faturamento.",
        "Aplique filtros de período para análises específicas.",
      ],
    }
  }
  if (pathname.startsWith("/admin/dashboard")) {
    return {
      title: "Ajuda • Dashboard",
      body: [
        "Visão geral de métricas recentes e atalhos para áreas principais.",
      ],
    }
  }
  return {
    title: "Ajuda",
    body: [
      "Esta janela apresenta dicas rápidas sobre a página atual.",
      "Navegue pelos itens do menu à esquerda para outras áreas do admin.",
    ],
  }
}
