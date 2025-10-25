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
    if (pathname.startsWith("/admin/dashboard")) {
      return {
        title: "Ajuda • Dashboard",
        body: [
          "Visão geral de métricas recentes e atalhos para áreas principais.",
          "A receita total reflete o faturamento total do mês atual. Os dados são atualizados automaticamente.",
          "A quantidade de agendamentos e novos clientes é calculada com base nos dados do mês atual. Os dados são atualizados automaticamente.",
          "O gráfico de agendamentos por dia da semana mostra a distribuição dos agendamentos ao longo do período selecionado. Os dados são atualizados automaticamente.",
          "A sidebar pode ser encolhida ou expandida clicando no ícone do menu (hamburger icon) no canto superior esquerdo.",
          "Caso os dados não estejam carregando, tente recarregar a página ou cheque sua conexão com à internet.",
        ],
      }
    }
    if (pathname.startsWith("/admin/agendamentos")) {
      return {
        title: "Ajuda • Agendamentos",
        body: [
          "Crie e gerencie agendamentos.",
          "Use o botão Adicionar Agendamento para criar um novo agendamento para um cliente.",
          "Caso queira agendar para um cliente que não está cadastrado, clique em 'Agendar manualmente' e preencha os campos de nome, email e telefone para adicionar um novo cliente.",
          "Após selecionar um serviço, somente barbeiros associados ao serviço selecionado aparecem nas sugestões.",
          "Se houver preço específico para o barbeiro, ele substitui o preço base.",
          "Conflitos de horário são checados automaticamente para cliente e barbeiro.",
          "A aba 'Calendário' mostra os agendamentos do mês atual em um calendário visual. Pode se alterar o mês e a visualização para semana, dia ou agenda.",
          "Caso os dados não estejam carregando, tente recarregar a página ou cheque sua conexão com à internet.",
        ],
      }
    }
  if (pathname.startsWith("/admin/servicos")) {
    return {
      title: "Ajuda • Serviços",
      body: [
        "Aqui você gerencia os serviços gerais da barbearia.",
        "Use o botão Adicionar Serviço para criar um serviço com nome, duração e preço base.",
        "Na edição, use o grupo de chips para escolher quais barbeiros realizam o serviço. Ao criar, todos os barbeiros são associados por padrão.",
        "O campo de busca de barbeiros permite adicionar/remover profissionais do serviço.",
        "A coluna de barbeiros atualiza imediatamente após salvar no modal de edição.",
        "Preços específicos por barbeiro substituem o preço base ao agendar. Você os gerencia em ‘Preços Específicos’. Itens com preço nulo não aparecem na lista.",
        "Ao excluir um serviço, suas associações e preços específicos são removidos automaticamente.",
        "Caso os dados não estejam carregando, tente recarregar a página ou cheque sua conexão com à internet.",
      ],
    }
  }
  if (pathname.startsWith("/admin/barbeiros")) {
    return {
      title: "Ajuda • Barbeiros",
      body: [
        "Liste e cadastre barbeiros. Busque um usuário já cadastrado no sistema para associá-lo como barbeiro.",
        "Caso queira adicionar um barbeiro manualmente, clique em 'Adicionar manualmente' e preencha os campos de nome, email e telefone.",
        "Caso queira enviar um email de convite para o barbeiro, marque a opção 'Enviar convite via email'.",
        "Caso os dados não estejam carregando, tente recarregar a página ou cheque sua conexão com à internet.",
      ],
    }
  }
  if (pathname.startsWith("/admin/clientes")) {
    return {
      title: "Ajuda • Clientes",
      body: [
        "Gerencie a lista declientes.",
        "Você pode buscar por nome ou e‑mail.",
        "Caso queira criar um novo cliente, somente é possível pela página de agendamentos, clicando em 'Agendar manualmente'.",
        "Caso os dados não estejam carregando, tente recarregar a página ou cheque sua conexão com à internet.",
      ],
    }
  }
  if (pathname.startsWith("/admin/disponibilidade")) {
    return {
      title: "Ajuda • Disponibilidade",
      body: [
        "Defina horários de trabalho e bloqueios para barbeiros.",
        "Os horários disponíveis para agendamento são calculados a partir dessas regras.",
        "Selecione o barbeiro em questão primeiramente para definir os horários de trabalho.",
        "Clique em 'Editar' para editar a disponibilidade do barbeiro em relação ao dia da semana selecionado.",
        "Caso queira definir um bloqueio ou hora de trabalho adicional específica, clique em 'Adicionar Bloqueio Específico'. Esse bloco não é recorrente.",
        "Caso os dados não estejam carregando, tente recarregar a página ou cheque sua conexão com à internet.",
      ],
    }
  }
  if (pathname.startsWith("/admin/relatorios")) {
    return {
      title: "Ajuda • Relatórios",
      body: [
        "Visualize métricas de agendamentos e faturamento.",
        "Use o seletor de período para filtrar: Última semana, Último mês (padrão), Último semestre, YTD (Year to Date) e Todo o período (desde 01/09/2025).",
        "Os gráficos e cards refletem o mesmo período selecionado nesta página.",
        "Caso os dados não estejam carregando, tente recarregar a página ou cheque sua conexão com à internet.",
      ],
    }
  }
  if (pathname.startsWith("/agendar")) {
    return {
      title: "Ajuda • Agendar",
      body: [
        "Escolha primeiro o serviço desejado para ver os barbeiros disponíveis.",
        "Depois selecione o barbeiro e a data. Os horários exibidos já consideram conflitos e disponibilidade.",
        "Se não aparecerem horários, tente escolher outra data ou outro barbeiro.",
        "Ao confirmar, você será redirecionado para 'Meus Agendamentos'.",
        "Caso os dados não estejam carregando, tente recarregar a página ou cheque sua conexão com à internet.",
      ],
    }
  }
  if (pathname.startsWith("/meus-agendamentos")) {
    return {
      title: "Ajuda • Meus Agendamentos",
      body: [
        "Aqui você visualiza seus agendamentos futuros e passados.",
        "Para criar um novo agendamento, use a página 'Agendar'.",
        "Caso não veja um agendamento recém-criado, recarregue a página.",
      ],
    }
  }
  if (pathname.startsWith("/barbeiro/agenda")) {
    return {
      title: "Ajuda • Agenda do Barbeiro",
      body: [
        "Visualize seus horários do dia e próximos agendamentos.",
        "Conflitos não são permitidos e bloqueios/expediente afetam a disponibilidade.",
        "Use o menu para navegar para o histórico de serviços.",
      ],
    }
  }
  if (pathname.startsWith("/barbeiro/historico-servicos")) {
    return {
      title: "Ajuda • Histórico do Barbeiro",
      body: [
        "Lista de serviços já realizados.",
        "Use os filtros da página (quando disponíveis) para refinar a busca.",
        "Caso os dados não estejam carregando, tente recarregar a página ou cheque sua conexão com à internet.",
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
