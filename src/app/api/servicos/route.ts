import { NextResponse } from "next/server";
import { assertHasPermission } from "~/lib/auth";
import { listServicosAtivos, createServico } from "~/server/db/queries";
import { z } from "zod";

export async function GET() {
  try {
    const rows = await listServicosAtivos();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Erro ao listar serviços" }, { status: 500 });
  }
}

const createServicoSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
  duracaoMinutos: z.number().int().positive(),
  precoBase: z.string().regex(/^\d+(\.\d{1,2})?$/),
  ativo: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    await assertHasPermission("servico:write");
    const json = (await req.json()) as unknown;
    const data = createServicoSchema.parse(json);
    const row = await createServico(data);
    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    if (typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "ZodError") {
      const errors = (err as { errors?: unknown }).errors ?? err;
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar serviço" }, { status: 500 });
  }
}
