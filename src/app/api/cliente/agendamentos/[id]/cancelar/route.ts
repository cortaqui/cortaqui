import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { agendamento, usuario } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, sessionClaims } = await auth();
    let email = (sessionClaims as Record<string, unknown> | null | undefined)?.email as string | undefined;
    if (!email && userId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
      } catch (clerkErr) {
        console.error("POST /api/cliente/agendamentos/[id]/cancelar clerk user fetch falhou:", { userId }, clerkErr)
      }
    }
    console.log("POST /api/cliente/agendamentos/[id]/cancelar", { id, userId, sessionClaims, derivedEmail: email })
    if (!email) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const [me] = await db.select().from(usuario).where(eq(usuario.email, email)).limit(1)
    if (!me) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

    const [row] = await db.select().from(agendamento).where(eq(agendamento.agendamentoId, id)).limit(1)
    if (!row) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 })

    if (row.fkClienteId !== me.userId) return NextResponse.json({ error: "Proibido" }, { status: 403 })

    const now = Date.now()
    const startsAt = new Date(row.dataHoraInicio as unknown as string | Date).getTime()
    const diffMs = startsAt - now
    const fiveHoursMs = 5 * 60 * 60 * 1000
    if (diffMs < fiveHoursMs) return NextResponse.json({ error: "Prazo para cancelamento expirado" }, { status: 403 })

    try {
      await db.execute(sql`UPDATE "cortaqui_agendamento" SET "status" = 'CANCELADO'::status_agendamento_enum, "updated_at" = NOW() WHERE "agendamento_id" = ${id}::uuid`)
    } catch (updateErr) {
      console.error("POST /api/cliente/agendamentos/[id]/cancelar update falhou:", { id }, updateErr)
      return NextResponse.json({ error: "Falha ao cancelar" }, { status: 500 })
    }

    const [updated] = await db.select().from(agendamento).where(eq(agendamento.agendamentoId, id)).limit(1)
    return NextResponse.json(updated ?? {})
  } catch (err) {
    console.error("POST /api/cliente/agendamentos/[id]/cancelar erro:", err)
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Erro ao cancelar agendamento" }, { status: 500 })
  }
}
