import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { servicoBarbeiro, usuario } from "~/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { id } = await params;
    const rows = await db
      .select({ id: usuario.userId, nome: usuario.nome, email: usuario.email, telefone: usuario.telefone })
      .from(servicoBarbeiro)
      .leftJoin(usuario, eq(usuario.userId, servicoBarbeiro.barbeiroUserId))
      .where(eq(servicoBarbeiro.servicoId, id));
    return NextResponse.json(rows.filter((r) => !!r.id));
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao listar barbeiros do serviço" }, { status: 500 });
  }
}

const putSchema = z.object({ barbeiroIds: z.array(z.string().uuid()).min(0) });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { id } = await params;
    const jsonUnknown = (await req.json()) as unknown;
    const data = putSchema.parse(jsonUnknown);

    // Fetch current associations
    const current = await db
      .select({ barbeiroUserId: servicoBarbeiro.barbeiroUserId })
      .from(servicoBarbeiro)
      .where(eq(servicoBarbeiro.servicoId, id));
    const currentIds = new Set(current.map((r) => r.barbeiroUserId));
    const desiredIds = new Set(data.barbeiroIds);
    const toDelete = [...currentIds].filter((b) => !desiredIds.has(b));
    const toInsert = [...desiredIds].filter((b) => !currentIds.has(b));

    if (toDelete.length > 0) {
      await db.delete(servicoBarbeiro).where(and(eq(servicoBarbeiro.servicoId, id), inArray(servicoBarbeiro.barbeiroUserId, toDelete)));
    }
    if (toInsert.length > 0) {
      await db.insert(servicoBarbeiro).values(toInsert.map((b) => ({ barbeiroUserId: b, servicoId: id, precoEspecifico: null })));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === "ZodError") {
      const er = e as { errors?: unknown };
      return NextResponse.json({ error: er.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar associações" }, { status: 500 });
  }
}
