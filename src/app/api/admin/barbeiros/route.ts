import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { usuario } from "~/server/db/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const rows = await db
      .select()
      .from(usuario)
      .where(and(eq(usuario.tipoUsuario, "BARBEIRO"), isNull(usuario.deletedAt)));
    return NextResponse.json(rows);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao listar barbeiros" }, { status: 500 });
  }
}

const createBarbeiroSchema = z.object({
  nome: z.string().min(1),
  email: z.string().email(),
  telefone: z.string().optional(),
  clerkUserId: z.string().optional(),
  sendInvite: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const jsonUnknown = (await req.json()) as unknown;
    const json = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as Record<string, unknown>) : {};
    const data = createBarbeiroSchema.parse(json);
    console.log("POST /api/admin/barbeiros payload:", { nome: data.nome, email: data.email, telefone: data.telefone, clerkUserId: data.clerkUserId, sendInvite: data.sendInvite ?? false })

    // Step 1: Manual upsert into local DB by unique email (avoid $onUpdate sql issues)
    let row;
    try {
      const existing = await db.select().from(usuario).where(eq(usuario.email, data.email)).limit(1);
      if (existing.length > 0) {
        const [r] = await db
          .update(usuario)
          .set({
            nome: data.nome,
            tipoUsuario: "BARBEIRO",
            ...(data.telefone ? { telefone: data.telefone } : {}),
            updatedAt: new Date(),
          })
          .where(eq(usuario.email, data.email))
          .returning();
        row = r;
      } else {
        const [r] = await db
          .insert(usuario)
          .values({
            nome: data.nome,
            email: data.email,
            tipoUsuario: "BARBEIRO",
            hashSenha: "clerk-managed",
            ...(data.telefone ? { telefone: data.telefone } : {}),
          })
          .returning();
        row = r;
      }
    } catch (dbErr) {
      console.error("DB upsert falhou:", dbErr)
      return NextResponse.json(
        { error: "DB upsert falhou", details: String(dbErr) },
        { status: 500 }
      );
    }

    // Step 2: Best-effort Clerk role assignment or invitation; do NOT fail the request if Clerk operations fail
    try {
      const client = await clerkClient();
      // Ignore invalid IDs that don't look like Clerk user IDs (e.g., generated UUIDs)
      const looksLikeClerkId = (id: string | undefined) => typeof id === 'string' && id.startsWith('user_');
      let targetId = looksLikeClerkId(data.clerkUserId) ? data.clerkUserId : undefined;

      if (!targetId) {
        try {
          const found = await client.users.getUserList({ emailAddress: [data.email], limit: 1 });
          const extracted = (() => {
            const anyFound: unknown = found;
            if (Array.isArray(anyFound)) {
              const first = anyFound[0] as { id?: unknown } | undefined;
              return typeof first?.id === 'string' ? first.id : undefined;
            }
            const dataArr = (anyFound as { data?: Array<{ id?: unknown }> })?.data;
            const first = Array.isArray(dataArr) ? dataArr[0] : undefined;
            return typeof first?.id === 'string' ? first.id : undefined;
          })();
          targetId = extracted;
        } catch (searchErr) {
          console.warn("[non-blocking] Clerk user search falhou:", searchErr)
        }
      }

      if (targetId) {
        try {
          if (typeof client.users.updateUser === 'function') {
            await client.users.updateUser(targetId, { publicMetadata: { role: "BARBEIRO" } });
          } else {
            await client.users.updateUserMetadata(targetId, { publicMetadata: { role: "BARBEIRO" } });
          }
        } catch (metaErr) {
          console.warn("[non-blocking] Clerk metadata update falhou:", metaErr)
        }
      } else {
        // If no existing Clerk user was found
        const parts = data.nome.trim().split(/\s+/);
        const firstName = parts[0] ?? data.nome;
        const lastName = parts.slice(1).join(" ") || null;

        if (data.sendInvite) {
          // Explicitly send an invitation when requested
          try {
            const inv = await client.invitations.createInvitation({
              emailAddress: data.email,
              publicMetadata: { role: "BARBEIRO" },
            });
            console.log("Clerk invitation created:", { id: (inv as { id?: string }).id, email: (inv as { emailAddress?: string }).emailAddress, status: (inv as { status?: string }).status })
          } catch (inviteErr) {
            console.warn("[non-blocking] Clerk createInvitation falhou:", inviteErr)
          }
        } else {
          // Otherwise, best-effort create the user silently
          try {
            await client.users.createUser({
              emailAddress: [data.email],
              firstName,
              lastName: lastName ?? undefined,
              publicMetadata: { role: "BARBEIRO" },
            });
          } catch (createErr) {
            console.warn("[non-blocking] Clerk createUser falhou (sendInvite=false):", createErr)
          }
        }
      }
    } catch (outerClerkErr) {
      console.warn("[non-blocking] Clerk integração falhou:", outerClerkErr)
    }

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/barbeiros erro inesperado:", e)
    if (e instanceof Response) return e;
    if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'ZodError') {
      const err = e as { errors?: unknown };
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar barbeiro" }, { status: 500 });
  }
}
