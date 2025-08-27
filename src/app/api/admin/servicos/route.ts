import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { listServicosAll, createServico } from "~/server/db/queries";
import { z } from "zod";

export async function GET() {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const rows = await listServicosAll();
    return NextResponse.json(rows);
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao listar serviços (admin)" }, { status: 500 });
  }
}

const adminCreateServicoSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  duracaoMinutos: z.number().int().positive(),
  precoBase: z.string().regex(/^\d+(\.\d{1,2})?$/),
  ativo: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const json = await req.json();
    const data = adminCreateServicoSchema.parse(json);
    const row = await createServico(data);
    return NextResponse.json(row, { status: 201 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    if (e?.name === "ZodError") return NextResponse.json({ error: e.errors }, { status: 400 });
    return NextResponse.json({ error: "Erro ao criar serviço (admin)" }, { status: 500 });
  }
}
