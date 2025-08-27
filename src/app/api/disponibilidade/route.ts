import { NextResponse } from "next/server";
import { assertHasAnyRole, assertHasPermission } from "~/lib/auth";
import { db } from "~/server/db";
import { disponibilidade, usuario } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const dayIndexToEnum = ["DOMINGO","SEGUNDA","TERCA","QUARTA","QUINTA","SEXTA","SABADO"] as const
const enumToDayIndex: Record<string, number> = { DOMINGO:0, SEGUNDA:1, TERCA:2, QUARTA:3, QUINTA:4, SEXTA:5, SABADO:6 }

function isThirtyMinuteStep(value: string | undefined) {
  if (!value) return false
  // value HH:MM
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value)
  if (!m) return false
  const minutes = Number(m[2])
  return minutes % 30 === 0
}

export async function GET(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const { searchParams } = new URL(req.url)
    const barbeiroId = searchParams.get("barbeiroId")
    if (!barbeiroId) return NextResponse.json({ error: "barbeiroId é obrigatório" }, { status: 400 })

    console.log("GET /api/disponibilidade", { barbeiroId })
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
    console.error("GET /api/disponibilidade erro:", e)
    if (e instanceof Response) return e
    return NextResponse.json({ error: "Erro ao listar disponibilidade" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await assertHasPermission("disponibilidade:write");
    const bodyUnknown = (await req.json()) as unknown
    const body = (bodyUnknown && typeof bodyUnknown === 'object') ? (bodyUnknown as Record<string, unknown>) : {}
    const barbeiroId = typeof body.barbeiroId === 'string' ? body.barbeiroId : ''
    const diaIndex = typeof body.diaSemana === 'number' ? body.diaSemana : Number(body.diaSemana)
    const horaInicio = typeof body.horaInicio === 'string' ? body.horaInicio : undefined;
    const horaFim = typeof body.horaFim === 'string' ? body.horaFim : undefined;
    console.log("PUT /api/disponibilidade payload:", { barbeiroId, diaIndex, horaInicio, horaFim })
    if (!barbeiroId || !(diaIndex>=0 && diaIndex<=6) || !isThirtyMinuteStep(horaInicio) || !isThirtyMinuteStep(horaFim)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }
    const diaEnum = dayIndexToEnum[diaIndex]

    // Ensure barber exists
    const exists = await db.select().from(usuario).where(eq(usuario.userId, barbeiroId)).limit(1)
    if (exists.length === 0) return NextResponse.json({ error: "Barbeiro não encontrado" }, { status: 404 })

    const timeStart = `${horaInicio}:00`
    const timeEnd = `${horaFim}:00`

    // Replace existing recurrent TRABALHO for that day
    await db.execute(sql`DELETE FROM "cortaqui_disponibilidade" WHERE "fk_Usuario_barbeiro_id" = ${barbeiroId}::uuid AND "tipo" = 'TRABALHO'::tipo_disponibilidade_enum AND "recorrente" = true AND "data_especifica" IS NULL AND "dia_semana" = ${diaEnum}::dia_semana_enum`)
    await db.execute(sql`INSERT INTO "cortaqui_disponibilidade" ("disponibilidade_id", "dia_semana", "hora_inicio", "hora_fim", "tipo", "data_especifica", "recorrente", "fk_Usuario_barbeiro_id", "updated_at") VALUES (gen_random_uuid(), ${diaEnum}::dia_semana_enum, ${timeStart}::time, ${timeEnd}::time, 'TRABALHO'::tipo_disponibilidade_enum, NULL, true, ${barbeiroId}::uuid, NOW())`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("PUT /api/disponibilidade erro:", err)
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Erro ao salvar disponibilidade" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await assertHasPermission("disponibilidade:write");
    const bodyUnknown = (await req.json()) as unknown
    const body = (bodyUnknown && typeof bodyUnknown === 'object') ? (bodyUnknown as Record<string, unknown>) : {}
    const barbeiroId = typeof body.barbeiroId === 'string' ? body.barbeiroId : ''
    const dateStr = typeof body.data === 'string' ? body.data : ''
    const horaInicio = typeof body.horaInicio === 'string' ? body.horaInicio : undefined;
    const horaFim = typeof body.horaFim === 'string' ? body.horaFim : undefined;
    const tipoInput = typeof body.tipo === 'string' ? body.tipo : undefined;
    const tipo = tipoInput?.toUpperCase() === 'TRABALHO' ? 'TRABALHO' : 'BLOQUEIO';
    const recorrente = Boolean(body.recorrente)
    const diaIndex = typeof body.diaSemana === 'number' ? body.diaSemana : Number.isFinite(Number(body.diaSemana)) ? Number(body.diaSemana) : null
    console.log("POST /api/disponibilidade payload:", { barbeiroId, dateStr, horaInicio, horaFim, tipo, recorrente, diaIndex })
    if (!barbeiroId || !dateStr || !isThirtyMinuteStep(horaInicio) || !isThirtyMinuteStep(horaFim)) {
      // allow recurring without date
      if (!(recorrente && diaIndex !== null)) {
        return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
      }
    }
    const timeStart = `${horaInicio}:00`
    const timeEnd = `${horaFim}:00`

    if (recorrente && diaIndex !== null) {
      const diaEnum = dayIndexToEnum[diaIndex]
      await db.execute(sql`INSERT INTO "cortaqui_disponibilidade" ("disponibilidade_id", "dia_semana", "hora_inicio", "hora_fim", "tipo", "data_especifica", "recorrente", "fk_Usuario_barbeiro_id", "updated_at") VALUES (gen_random_uuid(), ${diaEnum}::dia_semana_enum, ${timeStart}::time, ${timeEnd}::time, ${tipo}::tipo_disponibilidade_enum, NULL, true, ${barbeiroId}::uuid, NOW())`)
    } else {
      const date = new Date(dateStr)
      if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Data inválida" }, { status: 400 })
      await db.execute(sql`INSERT INTO "cortaqui_disponibilidade" ("disponibilidade_id", "dia_semana", "hora_inicio", "hora_fim", "tipo", "data_especifica", "recorrente", "fk_Usuario_barbeiro_id", "updated_at") VALUES (gen_random_uuid(), ${dayIndexToEnum[date.getDay()]}::dia_semana_enum, ${timeStart}::time, ${timeEnd}::time, ${tipo}::tipo_disponibilidade_enum, ${date.toISOString().slice(0,10)}::date, false, ${barbeiroId}::uuid, NOW())`)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/disponibilidade erro:", err)
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Erro ao criar bloqueio" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await assertHasPermission("disponibilidade:write");
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    console.log("DELETE /api/disponibilidade", { id })
    await db.execute(sql`DELETE FROM "cortaqui_disponibilidade" WHERE "disponibilidade_id" = ${id}::uuid`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/disponibilidade erro:", err)
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Erro ao excluir disponibilidade" }, { status: 500 });
  }
}
