import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { agendamento, pagamento } from "~/server/db/schema";

import { env } from "~/env";

// NOTE: Adjust signature header and verification as per AbacatePay docs

type BillingPaidData = {
  id: string;
  amount: number; // cents
  metadata?: { agendamentoId?: string } | null;
  products?: Array<{ externalId?: string | null; quantity?: number | null }>; // fallback for externalId
  methods?: string[];
};

function isBillingPaidEvent(ev: unknown): ev is { type: "billing.paid"; data: BillingPaidData } {
  if (typeof ev !== "object" || ev === null) return false;
  const obj = ev as Record<string, unknown>;
  if (obj.type !== "billing.paid" || typeof obj.data !== "object" || obj.data === null) return false;
  const data = obj.data as Record<string, unknown>;
  return typeof data.id === "string" && typeof data.amount === "number";
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-abacate-signature") ?? ""; // TODO: verify with env.ABACATEPAY_WEBHOOK_SECRET
    // TODO: Implement real signature verification (HMAC or JWT) from AbacatePay docs
    if (!signature || !env.ABACATEPAY_WEBHOOK_SECRET) {
      // In dev, allow without verification, but log
      if (process.env.NODE_ENV === "production") {
        return new NextResponse("invalid signature", { status: 401 });
      }
      console.warn("[Abacate webhook] Skipping signature verification in dev mode");
    }

    const parsed: unknown = JSON.parse(raw);

    if (isBillingPaidEvent(parsed)) {
      const billing = parsed.data;

      const agendamentoId = billing.metadata?.agendamentoId ?? billing.products?.[0]?.externalId ?? undefined;
      if (!agendamentoId) {
        console.warn("[Abacate webhook] Missing agendamentoId in metadata");
        return NextResponse.json({ ok: true });
      }

      // Atualiza o status do pagamento
      await db.update(pagamento).set({
        status: "APROVADO",
        idTransacaoGateway: billing.id,
        valor: (billing.amount / 100).toFixed(2),
        dataPagamento: new Date(),
        metodo: billing.methods?.[0] ?? "PIX",
      }).where(sql`${pagamento.fkAgendamentoId} = ${agendamentoId}`);

      // Marca o agendamento como CONCLUIDO
      await db.update(agendamento).set({ status: "CONCLUIDO" }).where(sql`${agendamento.agendamentoId} = ${agendamentoId}`);

      return NextResponse.json({ ok: true });
    }

    // Outros eventos podem ser tratados aqui, se necessário
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Abacate webhook] error", error);
    return new NextResponse("error", { status: 500 });
  }
}
