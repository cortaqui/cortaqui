import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { agendamento } from "~/server/db/schema";
import { and, eq, ne, lt, gt, sql } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { findUsuarioByEmail, createPagamento } from "~/server/db/queries";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const barbeiroId = searchParams.get("barbeiroId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    if (!barbeiroId) return NextResponse.json({ error: "barbeiroId é obrigatório" }, { status: 400 });

    let rows;
    if (dateStr) {
      // Calculate [start, end) window for the provided date (UTC day window)
      const start = new Date(`${dateStr}T00:00:00.000Z`);
      const end = new Date(`${dateStr}T23:59:59.999Z`);
      // Overlap condition: existing.start < end AND existing.end > start
      rows = await db
        .select({
          agendamentoId: agendamento.agendamentoId,
          fkBarbeiroId: agendamento.fkBarbeiroId,
          dataHoraInicio: agendamento.dataHoraInicio,
          dataHoraFim: agendamento.dataHoraFim,
          status: agendamento.status,
        })
        .from(agendamento)
        .where(
          and(
            eq(agendamento.fkBarbeiroId, barbeiroId),
            ne(agendamento.status, "CANCELADO"),
            lt(agendamento.dataHoraInicio, end),
            gt(agendamento.dataHoraFim, start)
          )
        );
    } else {
      rows = await db
        .select({
          agendamentoId: agendamento.agendamentoId,
          fkBarbeiroId: agendamento.fkBarbeiroId,
          dataHoraInicio: agendamento.dataHoraInicio,
          dataHoraFim: agendamento.dataHoraFim,
          status: agendamento.status,
        })
        .from(agendamento)
        .where(and(eq(agendamento.fkBarbeiroId, barbeiroId), ne(agendamento.status, "CANCELADO")));
    }

    return NextResponse.json(rows ?? []);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao listar agendamentos do barbeiro" }, { status: 500 });
  }
}

const createClienteAgendamentoSchema = z.object({
  barbeiroEmail: z.string().email(),
  servicoId: z.string().uuid(),
  dataHoraInicio: z.string().transform((s) => new Date(s)),
  dataHoraFim: z.string().transform((s) => new Date(s)),
  observacoesCliente: z.string().optional(),
  valorCobrado: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export async function POST(req: Request) {
  try {
    const jsonUnknown = (await req.json()) as unknown;
    const data = createClienteAgendamentoSchema.parse(jsonUnknown);

    const { userId, sessionClaims } = await auth();
    let email = (sessionClaims as Record<string, unknown> | null | undefined)?.email as string | undefined;
    if (!email && userId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
        email = primaryEmail ?? undefined;
      } catch (clerkErr) {
        console.error("POST /api/cliente/agendamentos clerk fetch user falhou:", { userId }, clerkErr)
      }
    }
    console.log("POST /api/cliente/agendamentos auth context:", { userId, sessionClaims, derivedEmail: email, payload: data })
    if (!email) return NextResponse.json({ error: "Não autenticado", details: "Sem email na sessão e falha ao obter via Clerk" }, { status: 401 });

    const cliente = await findUsuarioByEmail(email);
    const barbeiro = await findUsuarioByEmail(data.barbeiroEmail);
    if (!cliente || !barbeiro) return NextResponse.json({ error: "Usuários não encontrados" }, { status: 400 });

    if (!(data.dataHoraFim > data.dataHoraInicio)) return NextResponse.json({ error: "Horário inválido" }, { status: 400 });
    if (data.dataHoraInicio.getTime() < Date.now()) return NextResponse.json({ error: "Não é possível criar no passado" }, { status: 400 });

    // overlap check for the same barber
    let overlaps;
    try {
      overlaps = await db
      .select({ id: agendamento.agendamentoId })
      .from(agendamento)
      .where(
        and(
          eq(agendamento.fkBarbeiroId, barbeiro.userId),
          lt(agendamento.dataHoraInicio, data.dataHoraFim),
          gt(agendamento.dataHoraFim, data.dataHoraInicio),
          ne(agendamento.status, "CANCELADO")
        )
      )
      .limit(1);
    } catch (overlapErr) {
      console.error("POST /api/cliente/agendamentos overlap check falhou:", { barbeiroId: barbeiro.userId, start: data.dataHoraInicio, end: data.dataHoraFim }, overlapErr)
      return NextResponse.json({ error: "Falha ao verificar conflito" }, { status: 500 })
    }
    if (overlaps.length > 0) return NextResponse.json({ error: "Conflito de horário para o barbeiro" }, { status: 409 });

    // Raw SQL insert to avoid timestamp serialization issues
    const insertSql = sql`INSERT INTO "cortaqui_agendamento" (
      "agendamento_id",
      "data_hora_inicio",
      "data_hora_fim",
      "status",
      "observacoes_cliente",
      "valor_cobrado",
      "criado_por_admin",
      "fk_Servico_servico_id",
      "fk_Usuario_cliente_id",
      "fk_Usuario_barbeiro_id",
      "updated_at"
    ) VALUES (
      gen_random_uuid(),
      ${data.dataHoraInicio.toISOString()}::timestamptz,
      ${data.dataHoraFim.toISOString()}::timestamptz,
      'CONFIRMADO'::status_agendamento_enum,
      ${data.observacoesCliente ?? null},
      ${data.valorCobrado ?? null}::numeric,
      false,
      ${data.servicoId}::uuid,
      ${cliente.userId}::uuid,
      ${barbeiro.userId}::uuid,
      NOW()
    ) RETURNING *`;

    let row: Record<string, unknown> | null = null;
    try {
      const res = await db.execute(insertSql) as unknown as { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
      if (Array.isArray(res)) {
        row = res[0] ?? null
      } else if (res && typeof res === 'object' && Array.isArray((res as { rows?: unknown }).rows)) {
        row = ((res as { rows: Array<Record<string, unknown>> }).rows[0]) ?? null
      }
    } catch (dbErr) {
      console.error("POST /api/cliente/agendamentos insert falhou:", dbErr)
      return NextResponse.json({ error: "DB insert falhou", details: String(dbErr) }, { status: 500 })
    }

    try {
      const agId = typeof row?.agendamento_id === 'string' ? row?.agendamento_id : undefined
      if (agId) {
        await createPagamento({ fkAgendamentoId: agId, valor: data.valorCobrado ?? "0.00", status: "PENDENTE" });
      }
    } catch (payErr) {
      console.error("POST /api/cliente/agendamentos criar pagamento falhou:", payErr)
    }

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error("POST /api/cliente/agendamentos erro:", err)
    if (err instanceof Response) return err;
    if (typeof err === 'object' && err && 'name' in err && (err as { name?: string }).name === 'ZodError') {
      const errors = (err as { errors?: unknown }).errors ?? err
      return NextResponse.json({ error: errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Erro ao criar agendamento" }, { status: 500 });
  }
}
