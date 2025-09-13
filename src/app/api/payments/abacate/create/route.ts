import AbacatePay from 'abacatepay-nodejs-sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';

function maskMiddle(value: string, visibleStart = 4, visibleEnd = 2): string {
  if (!value) return '';
  if (value.length <= visibleStart + visibleEnd) return '*'.repeat(Math.max(0, value.length - 1));
  const start = value.slice(0, visibleStart);
  const end = value.slice(-visibleEnd);
  return `${start}${'*'.repeat(Math.max(3, value.length - (visibleStart + visibleEnd)))}${end}`;
}

function redactCustomer(customer: { name: string; email: string; cellphone?: string; taxId?: string }) {
  return {
    name: maskMiddle(customer.name, 2, 1),
    email: (() => {
      const atIdx = customer.email.indexOf('@');
      const userPart = atIdx >= 0 ? customer.email.slice(0, atIdx) : customer.email;
      const domainPart = atIdx >= 0 ? customer.email.slice(atIdx + 1) : '';
      return `${maskMiddle(userPart, 1, 0)}@${domainPart}`;
    })(),
    cellphone: customer.cellphone ? maskMiddle(customer.cellphone.replace(/\D/g, ''), 2, 2) : undefined,
    taxId: customer.taxId ? maskMiddle(customer.taxId.replace(/\D/g, ''), 3, 2) : undefined,
  };
}

const ProductSchema = z.object({
  externalId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  price: z.number().int().nonnegative(), // cents
});

const CustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  cellphone: z.string().optional(),
  taxId: z.string().optional(),
});

const BodySchema = z.object({
  products: z.array(ProductSchema).min(1).optional(),
  product: ProductSchema.optional(),
  customer: CustomerSchema.optional(),
  returnUrl: z.string().url(),
  completionUrl: z.string().url(),
}).refine((d) => ((d.products?.length ?? 0) > 0) || (d.product != null), {
  message: 'Provide either products[] or product',
  path: ['products'],
});

type CreateBillingResponse = { data?: { url?: string | null } | null; error?: string | null };

export async function POST(request: Request) {
  const requestId = (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startedAtMs = Date.now();

  let jsonUnknown: unknown;
  try {
    jsonUnknown = await request.json();
  } catch (e) {
    console.error('[abacate:create] invalid JSON', { requestId, error: String(e) });
    return NextResponse.json({ requestId, error: 'Invalid JSON body' }, { status: 400 });
  }

  console.log('[abacate:create] incoming body', { requestId, body: jsonUnknown });

  const parsed = BodySchema.safeParse(jsonUnknown);
  if (!parsed.success) {
    console.error('[abacate:create] validation error', { requestId, issues: parsed.error.flatten() });
    return NextResponse.json({ requestId, error: 'Invalid request body', issues: parsed.error.flatten() }, { status: 400 });
  }

  const abacatePay = AbacatePay(process.env.ABACATEPAY_API_KEY!);
  const apiKeyPreview = process.env.ABACATEPAY_API_KEY ? maskMiddle(process.env.ABACATEPAY_API_KEY, 4, 4) : '<missing>';
  console.log('[abacate:create] sdk init', { requestId, apiKeyPreview });

  try {
    const products = parsed.data.products ?? (parsed.data.product ? [parsed.data.product] : []);
    const customerPayload = parsed.data.customer
      ? {
          ...(parsed.data.customer.name ? { name: parsed.data.customer.name } : {}),
          ...(parsed.data.customer.email ? { email: parsed.data.customer.email } : {}),
          ...(parsed.data.customer.cellphone ? { cellphone: parsed.data.customer.cellphone } : {}),
          ...(parsed.data.customer.taxId ? { taxId: parsed.data.customer.taxId } : {}),
        }
      : undefined;
    const sdkPayload = {
      frequency: 'ONE_TIME' as const,
      methods: ['PIX'] as const,
      products,
      returnUrl: parsed.data.returnUrl,
      completionUrl: parsed.data.completionUrl,
      ...(customerPayload ? { customer: customerPayload } : {}),
    };
    const logPayload = { ...sdkPayload, ...(customerPayload ? { customer: redactCustomer(customerPayload as { name: string; email: string; cellphone?: string; taxId?: string }) } : {}) };
    console.log('[abacate:create] calling sdk.billing.create', { requestId, payload: logPayload });
    const billing: CreateBillingResponse = await abacatePay.billing.create(sdkPayload as unknown as Parameters<typeof abacatePay.billing.create>[0]) as CreateBillingResponse;

    const durationMs = Date.now() - startedAtMs;
    console.log('[abacate:create] sdk response', { requestId, response: billing, durationMs });
    return NextResponse.json({ requestId, data: billing?.data ?? null, error: billing?.error ?? null, durationMs }, { status: 200 });
  } catch (error: unknown) {
    const durationMs = Date.now() - startedAtMs;
    console.error('[abacate:create] sdk error', { requestId, error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error), durationMs });
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ requestId, error: message, durationMs }, { status: 500 });
  }
}
