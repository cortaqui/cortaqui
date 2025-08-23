import { db } from "~/server/db";
import { usuario, servico, disponibilidade, agendamento, pagamento, statusAgendamentoEnum, statusPagamentoEnum } from "~/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

export async function findUsuarioByEmail(email: string) {
  const rows = await db.select().from(usuario).where(eq(usuario.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function findUsuarioById(userId: string) {
  const rows = await db.select().from(usuario).where(eq(usuario.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function createUsuario(params: { nome: string; email: string; telefone?: string | null; tipo: "ADMIN" | "BARBEIRO" | "CLIENTE" }) {
  const [row] = await db
    .insert(usuario)
    .values({
      nome: params.nome,
      email: params.email,
      telefone: params.telefone ?? undefined,
      tipoUsuario: params.tipo,
      hashSenha: "clerk-managed",
    })
    .returning();
  return row;
}

export async function listServicosAtivos() {
  return await db.select().from(servico).where(eq(servico.ativo, true)).orderBy(desc(servico.updatedAt));
}

export async function listServicosAll() {
  return await db.select().from(servico).orderBy(desc(servico.updatedAt));
}

export async function createServico(params: { nome: string; descricao?: string; duracaoMinutos: number; precoBase: string; ativo: boolean }) {
  const [row] = await db
    .insert(servico)
    .values({
      nome: params.nome,
      descricao: params.descricao,
      duracaoMinutos: params.duracaoMinutos,
      precoBase: params.precoBase,
      ativo: params.ativo,
    })
    .returning();
  return row;
}

export async function listDisponibilidades() {
  return await db.select().from(disponibilidade).orderBy(desc(disponibilidade.updatedAt));
}

export async function listAgendamentosByRole(params: { role: "ADMIN" | "BARBEIRO" | "CLIENTE"; userEmail?: string | null }) {
  const clienteT = alias(usuario, "cliente");
  const barbeiroT = alias(usuario, "barbeiro");

  if (params.role === "ADMIN") {
    return await db
      .select({
        agendamentoId: agendamento.agendamentoId,
        fkClienteId: agendamento.fkClienteId,
        fkBarbeiroId: agendamento.fkBarbeiroId,
        fkServicoId: agendamento.fkServicoId,
        dataHoraInicio: agendamento.dataHoraInicio,
        dataHoraFim: agendamento.dataHoraFim,
        status: agendamento.status,
        observacoesCliente: agendamento.observacoesCliente,
        valorCobrado: agendamento.valorCobrado,
        updatedAt: agendamento.updatedAt,
        servico: {
          servicoId: servico.servicoId,
          nome: servico.nome,
          duracaoMinutos: servico.duracaoMinutos,
          precoBase: servico.precoBase,
        },
        cliente: {
          userId: clienteT.userId,
          nome: clienteT.nome,
          email: clienteT.email,
          telefone: clienteT.telefone,
        },
        barbeiro: {
          userId: barbeiroT.userId,
          nome: barbeiroT.nome,
          email: barbeiroT.email,
          telefone: barbeiroT.telefone,
        },
      })
      .from(agendamento)
      .leftJoin(servico, eq(servico.servicoId, agendamento.fkServicoId))
      .leftJoin(clienteT, eq(clienteT.userId, agendamento.fkClienteId))
      .leftJoin(barbeiroT, eq(barbeiroT.userId, agendamento.fkBarbeiroId))
      .orderBy(desc(agendamento.updatedAt));
  }

  if (!params.userEmail) return [];
  const user = await findUsuarioByEmail(params.userEmail);
  if (!user) return [];

  if (params.role === "BARBEIRO") {
    return await db
      .select({
        agendamentoId: agendamento.agendamentoId,
        fkClienteId: agendamento.fkClienteId,
        fkBarbeiroId: agendamento.fkBarbeiroId,
        fkServicoId: agendamento.fkServicoId,
        dataHoraInicio: agendamento.dataHoraInicio,
        dataHoraFim: agendamento.dataHoraFim,
        status: agendamento.status,
        observacoesCliente: agendamento.observacoesCliente,
        valorCobrado: agendamento.valorCobrado,
        updatedAt: agendamento.updatedAt,
        servico: {
          servicoId: servico.servicoId,
          nome: servico.nome,
          duracaoMinutos: servico.duracaoMinutos,
          precoBase: servico.precoBase,
        },
        cliente: {
          userId: clienteT.userId,
          nome: clienteT.nome,
          email: clienteT.email,
          telefone: clienteT.telefone,
        },
        barbeiro: {
          userId: barbeiroT.userId,
          nome: barbeiroT.nome,
          email: barbeiroT.email,
          telefone: barbeiroT.telefone,
        },
      })
      .from(agendamento)
      .leftJoin(servico, eq(servico.servicoId, agendamento.fkServicoId))
      .leftJoin(clienteT, eq(clienteT.userId, agendamento.fkClienteId))
      .leftJoin(barbeiroT, eq(barbeiroT.userId, agendamento.fkBarbeiroId))
      .where(eq(agendamento.fkBarbeiroId, user.userId))
      .orderBy(desc(agendamento.updatedAt));
  }
  // CLIENTE
  return await db
    .select({
      agendamentoId: agendamento.agendamentoId,
      fkClienteId: agendamento.fkClienteId,
      fkBarbeiroId: agendamento.fkBarbeiroId,
      fkServicoId: agendamento.fkServicoId,
      dataHoraInicio: agendamento.dataHoraInicio,
      dataHoraFim: agendamento.dataHoraFim,
      status: agendamento.status,
      observacoesCliente: agendamento.observacoesCliente,
      valorCobrado: agendamento.valorCobrado,
      updatedAt: agendamento.updatedAt,
      servico: {
        servicoId: servico.servicoId,
        nome: servico.nome,
        duracaoMinutos: servico.duracaoMinutos,
        precoBase: servico.precoBase,
      },
      cliente: {
        userId: clienteT.userId,
        nome: clienteT.nome,
        email: clienteT.email,
        telefone: clienteT.telefone,
      },
      barbeiro: {
        userId: barbeiroT.userId,
        nome: barbeiroT.nome,
        email: barbeiroT.email,
        telefone: barbeiroT.telefone,
      },
    })
    .from(agendamento)
    .leftJoin(servico, eq(servico.servicoId, agendamento.fkServicoId))
    .leftJoin(clienteT, eq(clienteT.userId, agendamento.fkClienteId))
    .leftJoin(barbeiroT, eq(barbeiroT.userId, agendamento.fkBarbeiroId))
    .where(eq(agendamento.fkClienteId, user.userId))
    .orderBy(desc(agendamento.updatedAt));
}

export async function createAgendamento(params: {
  fkClienteId: string;
  fkBarbeiroId: string;
  fkServicoId: string;
  dataHoraInicio: Date;
  dataHoraFim: Date;
  status?: typeof statusAgendamentoEnum.enumValues[number];
  observacoesCliente?: string | null;
  criadoPorAdmin?: boolean;
  valorCobrado?: string | null;
}) {
  const [row] = await db
    .insert(agendamento)
    .values({
      fkClienteId: params.fkClienteId,
      fkBarbeiroId: params.fkBarbeiroId,
      fkServicoId: params.fkServicoId,
      dataHoraInicio: params.dataHoraInicio,
      dataHoraFim: params.dataHoraFim,
      status: params.status ?? "PENDENTE",
      observacoesCliente: params.observacoesCliente ?? undefined,
      criadoPorAdmin: params.criadoPorAdmin ?? false,
      valorCobrado: params.valorCobrado ?? undefined,
    })
    .returning();
  return row;
}

export async function cancelAgendamento(agendamentoId: string) {
  const [row] = await db
    .update(agendamento)
    .set({ status: "CANCELADO" })
    .where(eq(agendamento.agendamentoId, agendamentoId))
    .returning();
  return row;
}

export async function createPagamento(params: {
  fkAgendamentoId: string;
  valor: string;
  metodo?: string | null;
  status?: typeof statusPagamentoEnum.enumValues[number];
}) {
  const [row] = await db
    .insert(pagamento)
    .values({
      fkAgendamentoId: params.fkAgendamentoId,
      valor: params.valor,
      metodo: params.metodo ?? undefined,
      status: params.status ?? "PENDENTE",
    })
    .returning();
  return row;
}
