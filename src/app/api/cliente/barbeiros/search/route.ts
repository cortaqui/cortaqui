import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { usuario } from "~/server/db/schema";
import { and, ilike, isNull, or, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) return NextResponse.json({ users: [] });

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
