import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { disponibilidade } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const enumToDayIndex: Record<string, number> = { DOMINGO:0, SEGUNDA:1, TERCA:2, QUARTA:3, QUINTA:4, SEXTA:5, SABADO:6 }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const barbeiroId = searchParams.get("barbeiroId")
    if (!barbeiroId) return NextResponse.json({ error: "barbeiroId é obrigatório" }, { status: 400 })

    const rows = await db
      .select()
      .from(disponibilidade)
      .where(eq(disponibilidade.fkBarbeiroId, barbeiroId))

    const result = rows.map((r) => ({
      id: r.disponibilidadeId,
      barbeiro_user_id: r.fkBarbeiroId!,
      tipo: r.tipo,
      recorrente: r.recorrente,
      dia_semana: typeof r.diaSemana === 'string' ? (enumToDayIndex[r.diaSemana] ?? null) : null,
      hora_inicio: String(r.horaInicio).slice(0,5),
      hora_fim: String(r.horaFim).slice(0,5),
      data_especifica: r.dataEspecifica ?? null,
      updated_at: r.updatedAt,
    }))

    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: "Erro ao listar disponibilidade" }, { status: 500 });
  }
}
