import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { servico } from "~/server/db/schema";
import { desc, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limitParam = Number(searchParams.get("limit") ?? "10");
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(50, Math.floor(limitParam))) : 10;

    if (q.length < 2) {
      const rows = await db
        .select({ id: servico.servicoId, name: servico.nome })
        .from(servico)
        .orderBy(desc(servico.updatedAt))
        .limit(limit);
      return NextResponse.json({ users: rows });
    }
    const rows = await db
      .select({ id: servico.servicoId, name: servico.nome })
      .from(servico)
      .where(ilike(servico.nome, `%${q}%`))
      .limit(limit);
    return NextResponse.json({ users: rows });
  } catch (e) {
    console.error("GET /api/admin/servicos/search error:", e);
    if (e instanceof Response) return e;
    return NextResponse.json({ users: [] });
  }
}
