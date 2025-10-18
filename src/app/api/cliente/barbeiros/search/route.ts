import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { usuario, servicoBarbeiro } from "~/server/db/schema";
import { and, ilike, isNull, or, eq, count, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const servicoId = searchParams.get("servicoId") ?? null;
    // For UI zero-query suggestions, allow returning recent barbers when q < 2
    if (q.length < 2 && !servicoId) {
      const rows = await db
        .select({ id: usuario.userId, name: usuario.nome, email: usuario.email, phone: usuario.telefone })
        .from(usuario)
        .where(and(eq(usuario.tipoUsuario, "BARBEIRO"), isNull(usuario.deletedAt)))
        .limit(10);
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
        // allow all barbers (matching query)
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
          .limit(10);
        return NextResponse.json({ users: rows });
      }
      // has associations: only those barbers
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
            or(ilike(usuario.nome, `%${q}%`), ilike(usuario.email, `%${q}%`))
          )
        )
        .limit(10);
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
      .limit(10);

    return NextResponse.json({ users: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ users: [] });
  }
}
