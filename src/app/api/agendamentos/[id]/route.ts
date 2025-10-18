import { NextResponse } from "next/server";
import { assertHasPermission } from "~/lib/auth";
import { db } from "~/server/db";
import { agendamento } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasPermission("agendamento:read");
    const { id } = await params;
    const [row] = await db.select().from(agendamento).where(eq(agendamento.agendamentoId, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Erro ao obter agendamento" }, { status: 500 });
  }
}

const updateAgendamentoSchema = z.object({
  dataHoraInicio: z.string().optional(),
  dataHoraFim: z.string().optional(),
  status: z.enum(["CONFIRMADO","PENDENTE","CANCELADO","CONCLUIDO"]).optional(),
  observacoesCliente: z.string().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasPermission("agendamento:write");
    const jsonUnknown = (await req.json()) as unknown;
    const { id } = await params;
    console.log("PUT /api/agendamentos/[id] payload:", { id, body: jsonUnknown });
    const data = updateAgendamentoSchema.parse(jsonUnknown);

    // Load existing to validate and for payment sync context
    const [existing] = await db.select().from(agendamento).where(eq(agendamento.agendamentoId, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

    const startStr = data.dataHoraInicio ?? null;
    const endStr = data.dataHoraFim ?? null;

    // Expect both start and end together if updating time
    if ((startStr && !endStr) || (!startStr && endStr)) {
      return NextResponse.json({ error: "Envie dataHoraInicio e dataHoraFim juntos" }, { status: 400 });
    }

    if (startStr && endStr) {
      const barberId = existing.fkBarbeiroId;
      const clientId = existing.fkClienteId;
      if (!barberId || !clientId) {
        return NextResponse.json({ error: "Dados do agendamento inválidos" }, { status: 500 });
      }
      // validate timeframe
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (!(e > s)) return NextResponse.json({ error: "Horário inválido" }, { status: 400 });

      // Overlap checks for barber (use ISO strings to avoid driver type issues)
      const resBarber = (await db.execute(sql`SELECT 1 FROM "cortaqui_agendamento"
        WHERE "fk_Usuario_barbeiro_id" = ${barberId}::uuid
          AND "agendamento_id" <> ${id}::uuid
          AND "status" <> 'CANCELADO'::status_agendamento_enum
          AND "data_hora_inicio" < ${e.toISOString()}::timestamptz
          AND "data_hora_fim" > ${s.toISOString()}::timestamptz
        LIMIT 1`)) as unknown as { rows?: unknown[] } | Array<Record<string, unknown>>;
      const hasBarberConflict = Array.isArray(resBarber)
        ? resBarber.length > 0
        : Array.isArray(resBarber?.rows) && resBarber.rows.length > 0;
      if (hasBarberConflict) {
        return NextResponse.json({ error: "Conflito de horário para o barbeiro" }, { status: 409 });
      }

      // Overlap checks for client
      const resClient = (await db.execute(sql`SELECT 1 FROM "cortaqui_agendamento"
        WHERE "fk_Usuario_cliente_id" = ${clientId}::uuid
          AND "agendamento_id" <> ${id}::uuid
          AND "status" <> 'CANCELADO'::status_agendamento_enum
          AND "data_hora_inicio" < ${e.toISOString()}::timestamptz
          AND "data_hora_fim" > ${s.toISOString()}::timestamptz
        LIMIT 1`)) as unknown as { rows?: unknown[] } | Array<Record<string, unknown>>;
      const hasClientConflict = Array.isArray(resClient)
        ? resClient.length > 0
        : Array.isArray(resClient?.rows) && resClient.rows.length > 0;
      if (hasClientConflict) {
        return NextResponse.json({ error: "Conflito de horário para o cliente" }, { status: 409 });
      }
      // Apply time update with ISO strings
      await db.execute(sql`UPDATE "cortaqui_agendamento" SET "data_hora_inicio" = ${s.toISOString()}::timestamptz, "data_hora_fim" = ${e.toISOString()}::timestamptz, "updated_at" = NOW() WHERE "agendamento_id" = ${id}::uuid`)
    }

    // Apply updates
    try {
      // time update is already applied above when both provided
      if (data.status !== undefined) {
        // First sync pagamento according to final status using raw SQL to avoid driver serialization issues
        if (data.status === "CONCLUIDO") {
          const valorDecimal = (existing.valorCobrado as unknown as string | null) ?? "0.00";
          await db.execute(sql`INSERT INTO "cortaqui_pagamento" ("fk_Agendamento_agendamento_id", "valor", "status", "updated_at")
            VALUES (${id}::uuid, ${valorDecimal}::numeric, 'APROVADO'::status_pagamento_enum, NOW())
            ON CONFLICT ("fk_Agendamento_agendamento_id") DO UPDATE SET
              "status" = 'APROVADO'::status_pagamento_enum,
              "valor" = ${valorDecimal}::numeric,
              "updated_at" = NOW()`)
        } else if (data.status === "CANCELADO") {
          await db.execute(sql`UPDATE "cortaqui_pagamento" SET "status" = 'REJEITADO'::status_pagamento_enum, "updated_at" = NOW() WHERE "fk_Agendamento_agendamento_id" = ${id}::uuid`)
        }

        await db.execute(sql`UPDATE "cortaqui_agendamento" SET "status" = ${data.status}::status_agendamento_enum, "updated_at" = NOW() WHERE "agendamento_id" = ${id}::uuid`)
      }
      if (data.observacoesCliente !== undefined) {
        await db.execute(sql`UPDATE "cortaqui_agendamento" SET "observacoes_cliente" = ${data.observacoesCliente}, "updated_at" = NOW() WHERE "agendamento_id" = ${id}::uuid`)
      }
    } catch (innerErr) {
      console.error("PUT /api/agendamentos/[id] DB update failed:", { id, data }, innerErr)
      throw innerErr
    }

    const [row] = await db.select().from(agendamento).where(eq(agendamento.agendamentoId, id)).limit(1);
    return NextResponse.json(row ?? {});
  } catch (err) {
    console.error("PUT /api/agendamentos/[id] erro:", err)
    if (err instanceof Response) return err;
    if (typeof err === "object" && err && "name" in err && (err as { name?: string }).name === "ZodError") {
      const errors = (err as { errors?: unknown }).errors ?? err;
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar agendamento", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasPermission("agendamento:write");
    const { id } = await params;
    const [row] = await db.delete(agendamento).where(eq(agendamento.agendamentoId, id)).returning();
    return NextResponse.json(row);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Erro ao excluir agendamento" }, { status: 500 });
  }
}
