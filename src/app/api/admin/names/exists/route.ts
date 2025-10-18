import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { servico, usuario } from "~/server/db/schema";
import { and, ilike, ne } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const name = (searchParams.get("name") ?? "").trim();
    if (!name) return NextResponse.json({ exists: false, in: null });

    // Normalize to case-insensitive exact equality by using ilike with anchors
    // Prefer exact match; avoid partials
    const pattern = name.replace(/[%_]/g, "");
    const excludeUserId = searchParams.get("excludeUserId");
    const excludeServicoId = searchParams.get("excludeServicoId");
    if (!name) return NextResponse.json({ exists: false, in: null });

    // Check usuarios (any tipo)
    const users = await db
      .select({ id: usuario.userId })
      .from(usuario)
      .where(
        excludeUserId
          ? and(ilike(usuario.nome, pattern), ne(usuario.userId, excludeUserId))
          : ilike(usuario.nome, pattern)
      )
      .limit(1);
    if (users.length > 0) return NextResponse.json({ exists: true, in: "usuario" as const });

    // Check servicos
    const servs = await db
      .select({ id: servico.servicoId })
      .from(servico)
      .where(
        excludeServicoId
          ? and(ilike(servico.nome, pattern), ne(servico.servicoId, excludeServicoId))
          : ilike(servico.nome, pattern)
      )
      .limit(1);
    if (servs.length > 0) return NextResponse.json({ exists: true, in: "servico" as const });

    return NextResponse.json({ exists: false, in: null });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ exists: false, in: null });
  }
}
