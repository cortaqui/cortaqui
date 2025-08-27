import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { agendamento, usuario, servico } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    let email = (sessionClaims as Record<string, unknown> | null | undefined)?.email as string | undefined;
    if (!email && userId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
      } catch (e) {
        console.error("GET /api/cliente/agendamentos/mine clerk user fetch falhou:", e)
      }
    }
    if (!email) return NextResponse.json([], { status: 200 })

    const [me] = await db.select().from(usuario).where(eq(usuario.email, email)).limit(1)
    if (!me) return NextResponse.json([], { status: 200 })

    const rows = await db
      .select({
        ag: agendamento,
        srv: {
          id: servico.servicoId,
          nome: servico.nome,
          duracaoMinutos: servico.duracaoMinutos,
          precoBase: servico.precoBase,
        },
        barb: {
          id: usuario.userId,
          nome: usuario.nome,
          email: usuario.email,
          telefone: usuario.telefone,
        },
      })
      .from(agendamento)
      .leftJoin(servico, eq(servico.servicoId, agendamento.fkServicoId))
      .leftJoin(usuario, eq(usuario.userId, agendamento.fkBarbeiroId))
      .where(eq(agendamento.fkClienteId, me.userId))
      .orderBy(desc(agendamento.dataHoraInicio))

    return NextResponse.json(rows)
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao listar meus agendamentos" }, { status: 500 })
  }
}
