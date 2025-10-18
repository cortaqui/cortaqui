import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { servicoBarbeiro, servico as servicoTable, usuario } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const barbeiroId = searchParams.get("barbeiroId");
    const base = db
      .select({
        barbeiroUserId: servicoBarbeiro.barbeiroUserId,
        servicoId: servicoBarbeiro.servicoId,
        precoEspecifico: servicoBarbeiro.precoEspecifico,
        updatedAt: servicoBarbeiro.updatedAt,
        servicoNome: servicoTable.nome,
        barbeiroNome: usuario.nome,
      })
      .from(servicoBarbeiro)
      .leftJoin(servicoTable, eq(servicoTable.servicoId, servicoBarbeiro.servicoId))
      .leftJoin(usuario, eq(usuario.userId, servicoBarbeiro.barbeiroUserId));

    const rowsRaw = barbeiroId ? await base.where(eq(servicoBarbeiro.barbeiroUserId, barbeiroId)) : await base;
    const rows = rowsRaw.filter((r) => r.precoEspecifico !== null && typeof r.precoEspecifico !== 'undefined')
    const result = rows.map((r) => ({
      barbeiroUserId: r.barbeiroUserId,
      servicoId: r.servicoId,
      precoEspecifico: r.precoEspecifico ?? null,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : (r.updatedAt as unknown as string),
      servicoNome: r.servicoNome ?? r.servicoId,
      barbeiroNome: r.barbeiroNome ?? r.barbeiroUserId,
    }))
    return NextResponse.json(result);
  } catch (e) {
    console.error("GET /api/admin/servicos/barbeiro error:", e);
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao listar serviços específicos" }, { status: 500 });
  }
}

const upsertSchema = z.object({
  barbeiroUserId: z.string().uuid(),
  servicoId: z.string().uuid(),
  precoEspecifico: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export async function POST(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const bodyUnknown = (await req.json()) as unknown;
    const data = upsertSchema.parse(bodyUnknown);
    console.log("POST /api/admin/servicos/barbeiro payload:", data)
    const [row] = await db
      .insert(servicoBarbeiro)
      .values({
        barbeiroUserId: data.barbeiroUserId,
        servicoId: data.servicoId,
        precoEspecifico: data.precoEspecifico,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [servicoBarbeiro.barbeiroUserId, servicoBarbeiro.servicoId],
        set: { precoEspecifico: data.precoEspecifico, updatedAt: new Date() },
      })
      .returning();
    const out = row
      ? {
          barbeiroUserId: row.barbeiroUserId,
          servicoId: row.servicoId,
          precoEspecifico: row.precoEspecifico ?? null,
          updatedAt:
            row.updatedAt instanceof Date
              ? row.updatedAt.toISOString()
              : ((row.updatedAt as unknown as string) ?? new Date().toISOString()),
        }
      : null
    return NextResponse.json(out, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/servicos/barbeiro error:", e);
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao salvar serviço específico" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const barbeiroUserId = searchParams.get("barbeiroUserId");
    const servicoId = searchParams.get("servicoId");
    if (!barbeiroUserId || !servicoId) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    const [row] = await db
      .delete(servicoBarbeiro)
      .where(and(eq(servicoBarbeiro.barbeiroUserId, barbeiroUserId), eq(servicoBarbeiro.servicoId, servicoId)))
      .returning();
    const out = row
      ? {
          barbeiroUserId: row.barbeiroUserId,
          servicoId: row.servicoId,
          precoEspecifico: row.precoEspecifico ?? null,
          updatedAt:
            row.updatedAt instanceof Date
              ? row.updatedAt.toISOString()
              : ((row.updatedAt as unknown as string) ?? new Date().toISOString()),
        }
      : null
    return NextResponse.json(out);
  } catch (e) {
    console.error("DELETE /api/admin/servicos/barbeiro error:", e);
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao excluir serviço específico" }, { status: 500 });
  }
}
