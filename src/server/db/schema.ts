import { pgTableCreator, pgEnum, uuid, varchar, text, integer, decimal, boolean, timestamp, time, date, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const createTable = pgTableCreator((name) => `cortaqui_${name}`);

export const tipoUsuarioEnum = pgEnum("tipo_usuario_enum", ["CLIENTE", "BARBEIRO", "ADMIN"]);
export const statusAgendamentoEnum = pgEnum("status_agendamento_enum", ["CONFIRMADO", "PENDENTE", "CANCELADO", "CONCLUIDO"]);
export const statusPagamentoEnum = pgEnum("status_pagamento_enum", ["APROVADO", "PENDENTE", "REJEITADO"]);
export const statusNotaEnum = pgEnum("status_nota_enum", ["EMITIDA", "CANCELADA", "ERRO"]);
export const diaSemanaEnum = pgEnum("dia_semana_enum", ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO", "DOMINGO"]);
export const tipoDisponibilidadeEnum = pgEnum("tipo_disponibilidade_enum", ["TRABALHO", "BLOQUEIO"]);

export const usuario = createTable("usuario", {
  userId: uuid("user_id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  telefone: varchar("telefone", { length: 20 }),
  hashSenha: varchar("hash_senha", { length: 150 }).notNull(),
  tipoUsuario: tipoUsuarioEnum("tipo_usuario").notNull(),
  dataCadastro: timestamp("data_cadastro", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const servico = createTable("servico", {
  servicoId: uuid("servico_id").primaryKey().defaultRandom(),
  nome: varchar("nome", { length: 100 }).notNull(),
  descricao: text("descricao"),
  duracaoMinutos: integer("duracao_minutos").notNull(), // CHECK (duracao_minutos > 0) handled in app logic
  precoBase: decimal("preco_base", { precision: 10, scale: 2 }).notNull(), // CHECK (preco_base >= 0) handled in app logic
  ativo: boolean("ativo").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const servicoBarbeiro = createTable("servico_barbeiro", {
  barbeiroUserId: uuid("barbeiro_user_id").notNull(),
  servicoId: uuid("servico_id").notNull(),
  precoEspecifico: decimal("preco_especifico", { precision: 10, scale: 2 }), // CHECK (preco_especifico >= 0 OR NULL) handled in app logic
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pk: primaryKey({ columns: [table.barbeiroUserId, table.servicoId] }),
}));

export const agendamento = createTable("agendamento", {
  agendamentoId: uuid("agendamento_id").primaryKey().defaultRandom(),
  dataHoraInicio: timestamp("data_hora_inicio", { withTimezone: true }).notNull(), // CHECK (data_hora_inicio > NOW()) handled in app logic
  dataHoraFim: timestamp("data_hora_fim", { withTimezone: true }).notNull(), // CHECK (data_hora_fim > data_hora_inicio) handled in app logic
  status: statusAgendamentoEnum("status").notNull(),
  observacoesCliente: text("observacoes_cliente"),
  valorCobrado: decimal("valor_cobrado", { precision: 10, scale: 2 }), // CHECK (valor_cobrado >= 0) handled in app logic
  criadoPorAdmin: boolean("criado_por_admin").notNull().default(false),
  fkServicoId: uuid("fk_Servico_servico_id").references(() => servico.servicoId, { onDelete: "cascade" }),
  fkClienteId: uuid("fk_Usuario_cliente_id").references(() => usuario.userId, { onDelete: "cascade" }),
  fkBarbeiroId: uuid("fk_Usuario_barbeiro_id").references(() => usuario.userId, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

export const pagamento = createTable("pagamento", {
  pagamentoId: uuid("pagamento_id").primaryKey().defaultRandom(),
  idTransacaoGateway: varchar("id_transacao_gateway", { length: 255 }),
  status: statusPagamentoEnum("status").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataPagamento: timestamp("data_pagamento", { withTimezone: true }),
  metodo: varchar("metodo", { length: 50 }),
  fkAgendamentoId: uuid("fk_Agendamento_agendamento_id").references(() => agendamento.agendamentoId, { onDelete: "cascade" }).unique(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});


export const disponibilidade = createTable("disponibilidade", {
  disponibilidadeId: uuid("disponibilidade_id").primaryKey().defaultRandom(),
  diaSemana: diaSemanaEnum("dia_semana").notNull(),
  horaInicio: time("hora_inicio").notNull(),
  horaFim: time("hora_fim").notNull(), // CHECK (hora_fim > hora_inicio) handled in app logic
  tipo: tipoDisponibilidadeEnum("tipo").notNull(),
  dataEspecifica: date("data_especifica"),
  recorrente: boolean("recorrente").notNull().default(true),
  fkAdminId: uuid("fk_Usuario_admin_id").references(() => usuario.userId, { onDelete: "cascade" }),
  fkBarbeiroId: uuid("fk_Usuario_barbeiro_id").references(() => usuario.userId, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => sql`CURRENT_TIMESTAMP`),
});

// Relationships
export const usuarioRelations = relations(usuario, ({ many }) => ({
  agendamentosCliente: many(agendamento, { relationName: "cliente" }),
  agendamentosBarbeiro: many(agendamento, { relationName: "barbeiro" }),
  disponibilidadesAdmin: many(disponibilidade, { relationName: "admin" }),
  disponibilidadesBarbeiro: many(disponibilidade, { relationName: "barbeiro" }),
  servicosBarbeiro: many(servicoBarbeiro),
}));

export const servicoRelations = relations(servico, ({ many }) => ({
  agendamentos: many(agendamento),
  servicosBarbeiro: many(servicoBarbeiro),
}));

export const servicoBarbeiroRelations = relations(servicoBarbeiro, ({ one }) => ({
  barbeiro: one(usuario, {
    fields: [servicoBarbeiro.barbeiroUserId],
    references: [usuario.userId],
  }),
  servico: one(servico, {
    fields: [servicoBarbeiro.servicoId],
    references: [servico.servicoId],
  }),
}));

export const agendamentoRelations = relations(agendamento, ({ one, many }) => ({
  servico: one(servico, {
    fields: [agendamento.fkServicoId],
    references: [servico.servicoId],
  }),
  cliente: one(usuario, {
    fields: [agendamento.fkClienteId],
    references: [usuario.userId],
    relationName: "cliente",
  }),
  barbeiro: one(usuario, {
    fields: [agendamento.fkBarbeiroId],
    references: [usuario.userId],
    relationName: "barbeiro",
  }),
  pagamento: many(pagamento),
}));

export const pagamentoRelations = relations(pagamento, ({ one }) => ({
  agendamento: one(agendamento, {
    fields: [pagamento.fkAgendamentoId],
    references: [agendamento.agendamentoId],
  }),
}));

export const disponibilidadeRelations = relations(disponibilidade, ({ one }) => ({
  admin: one(usuario, {
    fields: [disponibilidade.fkAdminId],
    references: [usuario.userId],
    relationName: "admin",
  }),
  barbeiro: one(usuario, {
    fields: [disponibilidade.fkBarbeiroId],
    references: [usuario.userId],
    relationName: "barbeiro",
  }),
}));
