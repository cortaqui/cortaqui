import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { servico } from "~/server/db/schema";
import { ilike } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) return NextResponse.json({ users: [] });
    const rows = await db
      .select({ id: servico.servicoId, name: servico.nome })
      .from(servico)
      .where(ilike(servico.nome, `%${q}%`))
      .limit(10);
    return NextResponse.json({ users: rows });
  } catch (e) {
    console.error("GET /api/admin/servicos/search error:", e);
    if (e instanceof Response) return e;
    return NextResponse.json({ users: [] });
  }
}
