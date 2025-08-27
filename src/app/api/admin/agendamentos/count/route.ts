import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { agendamento } from "~/server/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get("clienteId");
    if (!clienteId) {
      return NextResponse.json({ error: "clienteId é obrigatório" }, { status: 400 });
    }

    const [row] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(agendamento)
      .where(and(eq(agendamento.fkClienteId, clienteId), ne(agendamento.status, "CANCELADO")));

    return NextResponse.json({ count: row?.count ?? 0 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao obter total de agendamentos do cliente" }, { status: 500 });
  }
}
