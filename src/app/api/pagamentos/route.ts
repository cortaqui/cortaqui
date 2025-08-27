import { NextResponse } from "next/server";
import { assertHasPermission } from "~/lib/auth";
import { createPagamento } from "~/server/db/queries";
import { z } from "zod";

const pagamentoSchema = z.object({
  agendamentoId: z.string().uuid(),
  valor: z.string().regex(/^\d+(\.\d{1,2})?$/),
  metodo: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await assertHasPermission("pagamento:write");
    const json = (await req.json()) as unknown;
    const data = pagamentoSchema.parse(json);
    const row = await createPagamento({ fkAgendamentoId: data.agendamentoId, valor: data.valor, metodo: data.metodo ?? null });
    return NextResponse.json(row, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    if (typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "ZodError") {
      const errors = (err as { errors?: unknown }).errors ?? err;
      return NextResponse.json({ error: errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao processar pagamento" }, { status: 500 });
  }
}
