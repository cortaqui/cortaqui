import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { usuario } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    if (!email) return NextResponse.json({ error: 'email é obrigatório' }, { status: 400 })
    const rows = await db.select().from(usuario).where(eq(usuario.email, email)).limit(1)
    if (rows.length === 0) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Erro ao obter usuário' }, { status: 500 })
  }
}
