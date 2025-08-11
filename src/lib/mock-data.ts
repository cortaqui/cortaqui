import type { Usuario, Servico, Agendamento, Disponibilidade, RelatorioAdmin } from "./types"

export const mockUsuarios: Usuario[] = [
  {
    id: "1",
    clerk_user_id: "clerk_admin_1",
    nome: "João Silva",
    email: "joao@cortaqui.com",
    telefone: "(11) 99999-9999",
    tipo: "admin",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  },
  {
    id: "2",
    clerk_user_id: "clerk_barbeiro_1",
    nome: "Carlos Santos",
    email: "carlos@cortaqui.com",
    telefone: "(11) 88888-8888",
    tipo: "barbeiro",
    created_at: new Date("2024-01-15"),
    updated_at: new Date("2024-01-15"),
  },
  {
    id: "3",
    clerk_user_id: "clerk_barbeiro_2",
    nome: "Pedro Oliveira",
    email: "pedro@cortaqui.com",
    telefone: "(11) 77777-7777",
    tipo: "barbeiro",
    created_at: new Date("2024-02-01"),
    updated_at: new Date("2024-02-01"),
  },
  {
    id: "4",
    clerk_user_id: "clerk_cliente_1",
    nome: "Maria Costa",
    email: "maria@email.com",
    telefone: "(11) 66666-6666",
    tipo: "cliente",
    created_at: new Date("2024-03-01"),
    updated_at: new Date("2024-03-01"),
  },
  {
    id: "5",
    clerk_user_id: "clerk_cliente_2",
    nome: "José Ferreira",
    email: "jose@email.com",
    telefone: "(11) 55555-5555",
    tipo: "cliente",
    created_at: new Date("2024-03-15"),
    updated_at: new Date("2024-03-15"),
  },
]

export const mockServicos: Servico[] = [
  {
    id: "1",
    nome: "Corte Masculino",
    descricao: "Corte tradicional masculino com acabamento",
    duracao_minutos: 30,
    preco_base: 25.0,
    ativo: true,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  },
  {
    id: "2",
    nome: "Barba",
    descricao: "Aparar e modelar barba",
    duracao_minutos: 20,
    preco_base: 15.0,
    ativo: true,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  },
  {
    id: "3",
    nome: "Corte + Barba",
    descricao: "Pacote completo: corte e barba",
    duracao_minutos: 45,
    preco_base: 35.0,
    ativo: true,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  },
  {
    id: "4",
    nome: "Sobrancelha",
    descricao: "Aparar e modelar sobrancelha",
    duracao_minutos: 15,
    preco_base: 10.0,
    ativo: true,
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
  },
]

export const mockAgendamentos: Agendamento[] = [
  {
    id: "1",
    cliente_user_id: "4",
    barbeiro_user_id: "2",
    servico_id: "1",
    data_hora: new Date("2024-12-07T10:00:00"),
    status: "agendado",
    preco_final: 25.0,
    created_at: new Date("2024-12-06"),
    updated_at: new Date("2024-12-06"),
    cliente: mockUsuarios.find((u) => u.id === "4"),
    barbeiro: mockUsuarios.find((u) => u.id === "2"),
    servico: mockServicos.find((s) => s.id === "1"),
  },
  {
    id: "2",
    cliente_user_id: "5",
    barbeiro_user_id: "3",
    servico_id: "3",
    data_hora: new Date("2024-12-07T14:30:00"),
    status: "confirmado",
    preco_final: 35.0,
    created_at: new Date("2024-12-05"),
    updated_at: new Date("2024-12-06"),
    cliente: mockUsuarios.find((u) => u.id === "5"),
    barbeiro: mockUsuarios.find((u) => u.id === "3"),
    servico: mockServicos.find((s) => s.id === "3"),
  },
  {
    id: "3",
    cliente_user_id: "4",
    barbeiro_user_id: "2",
    servico_id: "2",
    data_hora: new Date("2024-12-05T16:00:00"),
    status: "concluido",
    preco_final: 15.0,
    created_at: new Date("2024-12-04"),
    updated_at: new Date("2024-12-05"),
    cliente: mockUsuarios.find((u) => u.id === "4"),
    barbeiro: mockUsuarios.find((u) => u.id === "2"),
    servico: mockServicos.find((s) => s.id === "2"),
  },
]

export const mockDisponibilidade: Disponibilidade[] = [
  // Carlos Santos - Segunda a Sexta
  {
    id: "1",
    barbeiro_user_id: "2",
    dia_semana: 1, // Segunda
    hora_inicio: "08:00",
    hora_fim: "18:00",
    tipo: "trabalho",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    barbeiro: mockUsuarios.find((u) => u.id === "2"),
  },
  {
    id: "2",
    barbeiro_user_id: "2",
    dia_semana: 2, // Terça
    hora_inicio: "08:00",
    hora_fim: "18:00",
    tipo: "trabalho",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    barbeiro: mockUsuarios.find((u) => u.id === "2"),
  },
  {
    id: "3",
    barbeiro_user_id: "2",
    dia_semana: 3, // Quarta
    hora_inicio: "08:00",
    hora_fim: "18:00",
    tipo: "trabalho",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    barbeiro: mockUsuarios.find((u) => u.id === "2"),
  },
  // Pedro Oliveira - Terça a Sábado
  {
    id: "4",
    barbeiro_user_id: "3",
    dia_semana: 2, // Terça
    hora_inicio: "09:00",
    hora_fim: "19:00",
    tipo: "trabalho",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    barbeiro: mockUsuarios.find((u) => u.id === "3"),
  },
  {
    id: "5",
    barbeiro_user_id: "3",
    dia_semana: 6, // Sábado
    hora_inicio: "08:00",
    hora_fim: "16:00",
    tipo: "trabalho",
    created_at: new Date("2024-01-01"),
    updated_at: new Date("2024-01-01"),
    barbeiro: mockUsuarios.find((u) => u.id === "3"),
  },
]

export const mockRelatorioAdmin: RelatorioAdmin = {
  faturamento_mes: 2450.0,
  total_agendamentos: 87,
  novos_clientes: 12,
  agendamentos_hoje: 8,
}

// Funções auxiliares para filtrar dados
export const getBarbeiros = () => mockUsuarios.filter((u) => u.tipo === "barbeiro")
export const getClientes = () => mockUsuarios.filter((u) => u.tipo === "cliente")
export const getServicosAtivos = () => mockServicos.filter((s) => s.ativo)
export const getAgendamentosByBarbeiro = (barbeiroId: string) =>
  mockAgendamentos.filter((a) => a.barbeiro_user_id === barbeiroId)
export const getAgendamentosByCliente = (clienteId: string) =>
  mockAgendamentos.filter((a) => a.cliente_user_id === clienteId)

// Mock data para gráficos e relatórios
export const mockFaturamentoMensal = [
  { mes: "Jul", faturamento: 1850, agendamentos: 74 },
  { mes: "Ago", faturamento: 2100, agendamentos: 84 },
  { mes: "Set", faturamento: 1950, agendamentos: 78 },
  { mes: "Out", faturamento: 2300, agendamentos: 92 },
  { mes: "Nov", faturamento: 2150, agendamentos: 86 },
  { mes: "Dez", faturamento: 2450, agendamentos: 98 },
]

export const mockAgendamentosSemana = [
  { dia: "Seg", agendamentos: 12 },
  { dia: "Ter", agendamentos: 15 },
  { dia: "Qua", agendamentos: 8 },
  { dia: "Qui", agendamentos: 14 },
  { dia: "Sex", agendamentos: 18 },
  { dia: "Sáb", agendamentos: 22 },
  { dia: "Dom", agendamentos: 0 },
]

export const mockRelatorioDetalhado = {
  faturamento_total: 14800.0,
  total_agendamentos: 512,
  total_clientes: 89,
  ticket_medio: 28.9,
  servicos_mais_populares: [
    { nome: "Corte Masculino", quantidade: 245, faturamento: 6125.0 },
    { nome: "Corte + Barba", quantidade: 156, faturamento: 5460.0 },
    { nome: "Barba", quantidade: 89, faturamento: 1335.0 },
    { nome: "Sobrancelha", quantidade: 22, faturamento: 220.0 },
  ],
  barbeiros_performance: [
    { nome: "Carlos Santos", agendamentos: 267, faturamento: 7425.0 },
    { nome: "Pedro Oliveira", agendamentos: 245, faturamento: 7375.0 },
  ],
  horarios_pico: [
    { horario: "14:00", agendamentos: 45 },
    { horario: "15:00", agendamentos: 42 },
    { horario: "16:00", agendamentos: 38 },
    { horario: "10:00", agendamentos: 35 },
    { horario: "11:00", agendamentos: 33 },
  ],
}
