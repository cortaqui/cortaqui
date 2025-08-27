import { NextResponse } from "next/server";
import { assertHasPermission } from "~/lib/auth";
import { cancelAgendamento } from "~/server/db/queries";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertHasPermission("agendamento:write");
    const { id } = await params;
    console.log("POST /api/agendamentos/[id]/cancelar", { id })
    const row = await cancelAgendamento(id);
    return NextResponse.json(row);
  } catch (err) {
    console.error("POST /api/agendamentos/[id]/cancelar erro:", err)
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Erro ao cancelar agendamento", details: String(err) }, { status: 500 });
  }
}
