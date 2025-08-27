import { NextResponse } from "next/server";
import { assertHasPermission, getCurrentUserRole } from "~/lib/auth";
import { createAgendamento, listAgendamentosByRole, findUsuarioByEmail, createPagamento } from "~/server/db/queries";
import { db } from "~/server/db";
import { agendamento } from "~/server/db/schema";
import { and, lt, gt, eq } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

export async function GET() {
  try {
    await assertHasPermission("agendamento:read");
    const { userId, sessionClaims } = await auth();
    let email = (sessionClaims as Record<string, unknown> | null | undefined)?.email as string | undefined;
    if (!email && userId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        email = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
      } catch (clerkErr) {
        console.error("GET /api/agendamentos clerk fetch user falhou:", { userId }, clerkErr)
      }
    }
    const role = await getCurrentUserRole();
    const rows = await listAgendamentosByRole({ role, userEmail: email ?? null });
    console.log("GET /api/agendamentos result:", { role, email: email ?? null, count: Array.isArray(rows) ? rows.length : 0 })
    return NextResponse.json(rows);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao listar agendamentos" }, { status: 500 });
  }
}

const createAgendamentoSchema = z.object({
  clienteEmail: z.string().email(),
  barbeiroEmail: z.string().email(),
  servicoId: z.string().uuid(),
  dataHoraInicio: z.string().transform((s) => new Date(s)),
  dataHoraFim: z.string().transform((s) => new Date(s)),
  observacoesCliente: z.string().optional(),
  valorCobrado: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export async function POST(req: Request) {
  try {
    await assertHasPermission("agendamento:write");
    const jsonUnknown = (await req.json()) as unknown;
    const data = createAgendamentoSchema.parse(jsonUnknown);
    const cliente = await findUsuarioByEmail(data.clienteEmail);
    const barbeiro = await findUsuarioByEmail(data.barbeiroEmail);
    if (!cliente || !barbeiro) return NextResponse.json({ error: "Usuários não encontrados" }, { status: 400 });
    // overlap check for the same barber
    if (!(data.dataHoraFim > data.dataHoraInicio)) return NextResponse.json({ error: "Horário inválido" }, { status: 400 });
    if (data.dataHoraInicio.getTime() < Date.now()) return NextResponse.json({ error: "Não é possível criar no passado" }, { status: 400 });

    const overlaps = await db
      .select({ id: agendamento.agendamentoId })
      .from(agendamento)
      .where(
        and(
          eq(agendamento.fkBarbeiroId, barbeiro.userId),
          // (existing.start < newEnd) AND (existing.end > newStart)
          and(lt(agendamento.dataHoraInicio, data.dataHoraFim), gt(agendamento.dataHoraFim, data.dataHoraInicio))
        )
      )
      .limit(1);
    if (overlaps.length > 0) return NextResponse.json({ error: "Conflito de horário para o barbeiro" }, { status: 409 });

    const row = await createAgendamento({
      fkClienteId: cliente.userId,
      fkBarbeiroId: barbeiro.userId,
      fkServicoId: data.servicoId,
      dataHoraInicio: data.dataHoraInicio,
      dataHoraFim: data.dataHoraFim,
      observacoesCliente: data.observacoesCliente ?? null,
      criadoPorAdmin: true,
      valorCobrado: data.valorCobrado,
      status: "CONFIRMADO",
    });
    // create pending payment
    try {
      if (row?.agendamentoId) {
        await createPagamento({ fkAgendamentoId: row.agendamentoId, valor: data.valorCobrado ?? "0.00", status: "PENDENTE" });
      }
    } catch (payErr) {
      console.error("Falha ao criar pagamento pendente:", payErr)
    }
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === "ZodError") {
      const errors = (e as { errors?: unknown }).errors ?? e
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar agendamento" }, { status: 500 });
  }
}
