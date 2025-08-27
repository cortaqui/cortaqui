import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { servico } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db
      .select()
      .from(servico)
      .where(and(eq(servico.servicoId, id), eq(servico.ativo, true)))
      .limit(1);
    if (!row) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao obter serviço" }, { status: 500 });
  }
}
