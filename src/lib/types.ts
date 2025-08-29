export interface Usuario {
  id: string
  clerk_user_id: string
  nome: string
  email: string
  telefone: string
  tipo: "admin" | "barbeiro" | "cliente"
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface Servico {
  id: string
  nome: string
  descricao?: string
  duracao_minutos: number
  preco_base: number
  ativo: boolean
  created_at: Date
  updated_at: Date
}

export interface Agendamento {
  id: string
  cliente_user_id: string
  barbeiro_user_id: string
  servico_id: string
  data_hora: Date
  status: "agendado" | "confirmado" | "em_andamento" | "concluido" | "cancelado"
  preco_final: number
  observacoes?: string
  created_at: Date
  updated_at: Date
  // Relacionamentos
  cliente?: Usuario
  barbeiro?: Usuario
  servico?: Servico
}

export interface Disponibilidade {
  id: string
  barbeiro_user_id: string
  dia_semana: number // 0-6 (domingo-sábado)
  hora_inicio: string // HH:mm
  hora_fim: string // HH:mm
  tipo: "trabalho" | "bloqueio"
  recorrente?: boolean
  data_especifica?: Date // Para bloqueios específicos
  created_at: Date
  updated_at: Date
  // Relacionamentos
  barbeiro?: Usuario
}

export interface RelatorioAdmin {
  faturamento_mes: number
  total_agendamentos: number
  novos_clientes: number
  agendamentos_hoje: number
}

export interface HorarioDisponivel {
  data_hora: Date
  barbeiro_user_id: string
  barbeiro_nome: string
}
