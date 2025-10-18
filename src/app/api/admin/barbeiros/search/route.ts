import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { usuario, servicoBarbeiro } from "~/server/db/schema";
import { and, ilike, isNull, or, eq, desc, count, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const servicoId = searchParams.get("servicoId") ?? null;
    const limitParam = Number(searchParams.get("limit") ?? "10");
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(50, Math.floor(limitParam))) : 10;

    if (q.length < 2 && !servicoId) {
      const rows = await db
        .select({ id: usuario.userId, name: usuario.nome, email: usuario.email, phone: usuario.telefone })
        .from(usuario)
        .where(and(eq(usuario.tipoUsuario, "BARBEIRO"), isNull(usuario.deletedAt)))
        .orderBy(desc(usuario.updatedAt))
        .limit(limit);
      return NextResponse.json({ users: rows });
    }

    // If filtering by serviço, apply association semantics
    if (servicoId) {
      const assocArr = await db
        .select({ c: count() })
        .from(servicoBarbeiro)
        .where(eq(servicoBarbeiro.servicoId, servicoId));
      const assocCount = assocArr[0]?.c ?? 0;
      if (assocCount === 0) {
        // allow all barbers (matching query if provided)
        const rows = await db
          .select({ id: usuario.userId, name: usuario.nome, email: usuario.email, phone: usuario.telefone })
          .from(usuario)
          .where(
            and(
              eq(usuario.tipoUsuario, "BARBEIRO"),
              isNull(usuario.deletedAt),
              q.length >= 2 ? or(ilike(usuario.nome, `%${q}%`), ilike(usuario.email, `%${q}%`)) : eq(usuario.userId, usuario.userId)
            )
          )
          .orderBy(desc(usuario.updatedAt))
          .limit(limit);
        return NextResponse.json({ users: rows });
      }
      // has associations: only associated
      const assocRows = await db
        .select({ id: servicoBarbeiro.barbeiroUserId })
        .from(servicoBarbeiro)
        .where(eq(servicoBarbeiro.servicoId, servicoId));
      const ids = assocRows.map((r) => r.id);
      if (ids.length === 0) return NextResponse.json({ users: [] });
      const rows = await db
        .select({ id: usuario.userId, name: usuario.nome, email: usuario.email, phone: usuario.telefone })
        .from(usuario)
        .where(
          and(
            eq(usuario.tipoUsuario, "BARBEIRO"),
            isNull(usuario.deletedAt),
            inArray(usuario.userId, ids),
            q.length >= 2 ? or(ilike(usuario.nome, `%${q}%`), ilike(usuario.email, `%${q}%`)) : eq(usuario.userId, usuario.userId)
          )
        )
        .orderBy(desc(usuario.updatedAt))
        .limit(limit);
      return NextResponse.json({ users: rows });
    }

    // No serviço filter
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
