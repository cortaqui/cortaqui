import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { servico } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { id } = await params;
    const [row] = await db.select().from(servico).where(eq(servico.servicoId, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e: unknown) {
    console.error("GET /api/admin/servicos/[id] error:", e);
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao obter serviço (admin)" }, { status: 500 });
  }
}

const updateServicoSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
  duracaoMinutos: z.number().int().positive().optional(),
  precoBase: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  ativo: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const json = (await req.json()) as unknown;
    const data = updateServicoSchema.parse(json);
    const { id } = await params;
    console.log("PUT /api/admin/servicos/[id] payload:", { id, data });
    const updateValues: Partial<typeof servico.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (typeof data.nome === 'string') updateValues.nome = data.nome;
    if (typeof data.descricao === 'string') updateValues.descricao = data.descricao;
    if (typeof data.duracaoMinutos === 'number') updateValues.duracaoMinutos = data.duracaoMinutos;
    if (typeof data.precoBase === 'string') updateValues.precoBase = data.precoBase;
    if (typeof data.ativo === 'boolean') updateValues.ativo = data.ativo;
    const [row] = await db.update(servico).set(updateValues).where(eq(servico.servicoId, id)).returning();
    return NextResponse.json(row);
  } catch (e: unknown) {
    console.error("PUT /api/admin/servicos/[id] error:", e);
    if (e instanceof Response) return e;
    if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === "ZodError") {
      const errs = (e as { errors?: unknown }).errors ?? []
      return NextResponse.json({ error: errs }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar serviço (admin)" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { id } = await params;
    const [row] = await db.delete(servico).where(eq(servico.servicoId, id)).returning();
    return NextResponse.json(row);
  } catch (e: unknown) {
    console.error("DELETE /api/admin/servicos/[id] error:", e);
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao excluir serviço (admin)" }, { status: 500 });
  }
}
