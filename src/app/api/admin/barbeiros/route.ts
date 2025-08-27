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
});

export async function POST(req: Request) {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const jsonUnknown = (await req.json()) as unknown;
    const json = (jsonUnknown && typeof jsonUnknown === 'object') ? (jsonUnknown as Record<string, unknown>) : {};
    const data = createBarbeiroSchema.parse(json);
    console.log("POST /api/admin/barbeiros payload:", { nome: data.nome, email: data.email, telefone: data.telefone, clerkUserId: data.clerkUserId })

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

    // Step 2: If Clerk user id provided, set role; otherwise, try to locate by email and set role or create user
    try {
      const client = await clerkClient();
      let targetId = data.clerkUserId;
      if (!targetId) {
        try {
          const found = await client.users.getUserList({ emailAddress: [data.email], limit: 1 });
          targetId = found.data?.[0]?.id;
        } catch (searchErr) {
          console.error("Clerk user search falhou:", searchErr)
          return NextResponse.json(
            { error: "Clerk user search falhou", details: String(searchErr) },
            { status: 500 }
          );
        }
      }
      if (targetId) {
        try {
          await client.users.updateUserMetadata(targetId, { publicMetadata: { role: "BARBEIRO" } });
        } catch (metaErr) {
          console.error("Clerk updateUserMetadata falhou:", metaErr)
          return NextResponse.json(
            { error: "Clerk updateUserMetadata falhou", details: String(metaErr), clerkUserId: targetId },
            { status: 500 }
          );
        }
      } else {
        // Create Clerk user if not found
        const parts = data.nome.trim().split(/\s+/);
        const firstName = parts[0] ?? data.nome;
        const lastName = parts.slice(1).join(" ") || null;
        try {
          await client.users.createUser({
            emailAddress: [data.email],
            firstName,
            lastName: lastName ?? undefined,
            publicMetadata: { role: "BARBEIRO" },
          });
        } catch (createErr) {
          console.error("Clerk createUser falhou:", createErr)
          // Fallback: send an invitation if direct user creation is blocked (e.g., 422)
          if (createErr && typeof createErr === 'object' && 'status' in createErr && (createErr as { status?: number }).status === 422) {
            try {
              const inv = await client.invitations.createInvitation({
                emailAddress: data.email,
                publicMetadata: { role: "BARBEIRO" },
              });
              console.log("Clerk invitation created:", { id: inv.id, email: inv.emailAddress, status: inv.status })
            } catch (inviteErr) {
              console.error("Clerk createInvitation falhou:", inviteErr)
              return NextResponse.json(
                { error: "Clerk createUser e createInvitation falharam", details: String(inviteErr) },
                { status: 500 }
              );
            }
          } else {
            return NextResponse.json(
              { error: "Clerk createUser falhou", details: String(createErr) },
              { status: 500 }
            );
          }
        }
        // best-effort: nothing else needed; webhook will upsert too
      }
    } catch (outerClerkErr) {
      console.error("Clerk integração falhou:", outerClerkErr)
      return NextResponse.json(
        { error: "Clerk integração falhou", details: String(outerClerkErr) },
        { status: 500 }
      );
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
