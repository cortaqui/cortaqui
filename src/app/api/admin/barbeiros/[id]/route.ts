import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { usuario } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { id } = await params;
    console.log("GET /api/admin/barbeiros/[id]", { id })
    const [row] = await db.select().from(usuario).where(eq(usuario.userId, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Barbeiro não encontrado" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("GET /api/admin/barbeiros/[id] erro:", e)
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao obter barbeiro" }, { status: 500 });
  }
}

const updateBarbeiroSchema = z.object({ nome: z.string().min(1).optional(), telefone: z.string().optional() });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const bodyUnknown = (await req.json()) as unknown
    const body = (bodyUnknown && typeof bodyUnknown === 'object') ? (bodyUnknown as Record<string, unknown>) : {}
    const data = updateBarbeiroSchema.parse(body);
    const { id } = await params;
    console.log("PUT /api/admin/barbeiros/[id]", { id, data })
    // Use raw SQL updates to avoid driver issues with timestamp onUpdate
    if (data.nome !== undefined) {
      await db.execute(sql`UPDATE cortaqui_usuario SET nome = ${data.nome}, updated_at = NOW() WHERE user_id = ${id}`)
    }
    if (data.telefone !== undefined) {
      await db.execute(sql`UPDATE cortaqui_usuario SET telefone = ${data.telefone}, updated_at = NOW() WHERE user_id = ${id}`)
    }
    const [row] = await db.select().from(usuario).where(eq(usuario.userId, id)).limit(1);
    return NextResponse.json(row ?? {});
  } catch (e) {
    console.error("PUT /api/admin/barbeiros/[id] erro:", e)
    if (e instanceof Response) return e;
    if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'ZodError') {
      const err = e as { errors?: unknown };
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar barbeiro" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { id } = await params;
    console.log("DELETE /api/admin/barbeiros/[id]", { id })
    // Soft delete: mark deleted_at and downgrade role to CLIENTE
    await db.execute(sql`UPDATE cortaqui_usuario SET deleted_at = NOW(), tipo_usuario = 'CLIENTE', updated_at = NOW() WHERE user_id = ${id}`)
    const [row] = await db.select().from(usuario).where(eq(usuario.userId, id)).limit(1);
    return NextResponse.json(row ?? {});
  } catch (e) {
    console.error("DELETE /api/admin/barbeiros/[id] erro:", e)
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao excluir barbeiro", details: String(e) }, { status: 500 });
  }
}
