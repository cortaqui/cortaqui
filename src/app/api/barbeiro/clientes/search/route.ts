import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { agendamento, usuario } from "~/server/db/schema";
import { and, eq, ilike } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ users: [] });
    let email = (sessionClaims as Record<string, unknown> | null | undefined)?.email as string | undefined;
    if (!email) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
      } catch {
        return NextResponse.json({ users: [] });
      }
    }
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) return NextResponse.json({ users: [] });

    // Resolve current barber id
    if (!email) return NextResponse.json({ users: [] });
    const [me] = await db.select().from(usuario).where(eq(usuario.email, email)).limit(1);
    if (!me) return NextResponse.json({ users: [] });

    // Find distinct clients who have agendamentos with this barber and match query
    const rows = await db
      .select({ id: usuario.userId, name: usuario.nome, email: usuario.email })
      .from(agendamento)
      .leftJoin(usuario, eq(usuario.userId, agendamento.fkClienteId))
      .where(and(eq(agendamento.fkBarbeiroId, me.userId), ilike(usuario.nome, `%${q}%`)))
      .groupBy(usuario.userId, usuario.nome, usuario.email)
      .limit(10);

    return NextResponse.json({ users: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ users: [] });
  }
}
