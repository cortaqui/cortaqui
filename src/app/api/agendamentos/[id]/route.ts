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
  dataHoraInicio: z.string().transform((s) => new Date(s)).optional(),
  dataHoraFim: z.string().transform((s) => new Date(s)).optional(),
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

    // Use raw SQL updates per-field to avoid timestamp serialization issues
    try {
      if (data.dataHoraInicio !== undefined) {
        await db.execute(sql`UPDATE "cortaqui_agendamento" SET "data_hora_inicio" = ${data.dataHoraInicio.toISOString()}::timestamptz, "updated_at" = NOW() WHERE "agendamento_id" = ${id}::uuid`)
      }
      if (data.dataHoraFim !== undefined) {
        await db.execute(sql`UPDATE "cortaqui_agendamento" SET "data_hora_fim" = ${data.dataHoraFim.toISOString()}::timestamptz, "updated_at" = NOW() WHERE "agendamento_id" = ${id}::uuid`)
      }
      if (data.status !== undefined) {
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
