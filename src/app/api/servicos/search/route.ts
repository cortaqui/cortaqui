import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { servico } from "~/server/db/schema";
import { and, eq, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) return NextResponse.json({ users: [] });
    const rows = await db
      .select({ id: servico.servicoId, name: servico.nome })
      .from(servico)
      .where(and(eq(servico.ativo, true), ilike(servico.nome, `%${q}%`)))
      .limit(10);
    return NextResponse.json({ users: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ users: [] });
  }
}
