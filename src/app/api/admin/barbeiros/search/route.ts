import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { usuario } from "~/server/db/schema";
import { and, ilike, isNull, or, eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const limitParam = Number(searchParams.get("limit") ?? "10");
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(50, Math.floor(limitParam))) : 10;

    if (q.length < 2) {
      const rows = await db
        .select({ id: usuario.userId, name: usuario.nome, email: usuario.email, phone: usuario.telefone })
        .from(usuario)
        .where(and(eq(usuario.tipoUsuario, "BARBEIRO"), isNull(usuario.deletedAt)))
        .orderBy(desc(usuario.updatedAt))
        .limit(limit);
      return NextResponse.json({ users: rows });
    }

    const rows = await db
      .select({ id: usuario.userId, name: usuario.nome, email: usuario.email, phone: usuario.telefone })
      .from(usuario)
      .where(
        and(
          eq(usuario.tipoUsuario, "BARBEIRO"),
          isNull(usuario.deletedAt),
          or(ilike(usuario.nome, `%${q}%`), ilike(usuario.email, `%${q}%`))
        )
      )
      .limit(limit);

    return NextResponse.json({ users: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ users: [] });
  }
}
