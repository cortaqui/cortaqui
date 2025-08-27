import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { disponibilidade } from "~/server/db/schema";
import { findUsuarioByEmail } from "~/server/db/queries";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

export async function GET() {
  try {
    await assertHasAnyRole(["ADMIN"]);
    // Basic admin list could be same as public list for now; extend with filters as needed
    const rows = await db.select().from(disponibilidade);
    return NextResponse.json(rows);
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao listar disponibilidade (admin)" }, { status: 500 });
  }
}

const createDisponSchema = z.object({
  barbeiroUserId: z.string().uuid(),
  diaSemana: z.union([
    z.number().int().min(0).max(6),
    z.enum(["SEGUNDA","TERCA","QUARTA","QUINTA","SEXTA","SABADO","DOMINGO"]),
  ]),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFim: z.string().regex(/^\d{2}:\d{2}$/),
  tipo: z.union([z.enum(["TRABALHO","BLOQUEIO"]), z.enum(["trabalho","bloqueio"]) ]),
  dataEspecifica: z.string().date().optional().or(z.string().length(0)).optional(),
});

export async function POST(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const user = await currentUser();
    const adminEmail = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
    if (!adminEmail) return NextResponse.json({ error: "Admin sem e-mail" }, { status: 400 });
    const admin = await findUsuarioByEmail(adminEmail);
    if (!admin) return NextResponse.json({ error: "Admin não encontrado" }, { status: 400 });

    const json = (await req.json()) as unknown;
    const data = createDisponSchema.parse(json);

    const mapDia = (d: number | string) => {
      if (typeof d === "string") return d as any;
      return ["DOMINGO","SEGUNDA","TERCA","QUARTA","QUINTA","SEXTA","SABADO"][d === 0 ? 0 : d] as any;
    };
    const mapTipo = (t: string) => (t.toUpperCase() === "TRABALHO" ? "TRABALHO" : "BLOQUEIO") as any;

    const [row] = await db
      .insert(disponibilidade)
      .values({
        fkAdminId: admin.userId,
        fkBarbeiroId: data.barbeiroUserId,
        diaSemana: mapDia(data.diaSemana),
        horaInicio: data.horaInicio as any,
        horaFim: data.horaFim as any,
        tipo: mapTipo(typeof data.tipo === "string" ? data.tipo : (data.tipo as any)),
        dataEspecifica: data.dataEspecifica && data.dataEspecifica.length > 0 ? (data.dataEspecifica as any) : undefined,
      })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (e?.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: "Erro ao criar disponibilidade (admin)" }, { status: 500 });
  }
}
