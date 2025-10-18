import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { servico } from "~/server/db/schema";
import { computeEffectiveServicoPrice } from "~/server/db/queries";
import { and, eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { searchParams } = new URL(req.url);
    const barbeiroId = searchParams.get("barbeiroId");
    const { id } = await params;
    const [row] = await db
      .select()
      .from(servico)
      .where(and(eq(servico.servicoId, id), eq(servico.ativo, true)))
      .limit(1);
    if (!row) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
    if (barbeiroId) {
      const eff = await computeEffectiveServicoPrice({ servicoId: id, barbeiroId });
      return NextResponse.json({ ...row, precoFinal: eff?.precoFinal ?? row.precoBase });
    }
    return NextResponse.json({ ...row, precoFinal: row.precoBase });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao obter serviço" }, { status: 500 });
  }
}
