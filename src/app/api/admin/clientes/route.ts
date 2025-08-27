import { NextResponse } from "next/server";
import { assertHasAnyRole } from "~/lib/auth";
import { db } from "~/server/db";
import { usuario } from "~/server/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

export async function GET() {
  try {
    await assertHasAnyRole(["ADMIN"]);
    const rows = await db
      .select()
      .from(usuario)
      .where(and(eq(usuario.tipoUsuario, "CLIENTE"), isNull(usuario.deletedAt)));
    return NextResponse.json(rows);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Erro ao listar clientes" }, { status: 500 });
  }
}

const createClienteSchema = z.object({
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
    const data = createClienteSchema.parse(json);
    console.log("POST /api/admin/clientes payload:", { nome: data.nome, email: data.email, telefone: data.telefone, clerkUserId: data.clerkUserId })

    // manual upsert to avoid timestamp issues
    let row;
    try {
      const existing = await db.select().from(usuario).where(eq(usuario.email, data.email)).limit(1);
      if (existing.length > 0) {
        const _ = await db
          .update(usuario)
          .set({ nome: data.nome, tipoUsuario: "CLIENTE", ...(data.telefone ? { telefone: data.telefone } : {}), updatedAt: new Date() })
          .where(eq(usuario.email, data.email));
        row = (await db.select().from(usuario).where(eq(usuario.email, data.email)).limit(1))[0];
      } else {
        const _ = await db
          .insert(usuario)
          .values({ nome: data.nome, email: data.email, tipoUsuario: "CLIENTE", hashSenha: "clerk-managed", ...(data.telefone ? { telefone: data.telefone } : {}) });
        row = (await db.select().from(usuario).where(eq(usuario.email, data.email)).limit(1))[0];
      }
    } catch (dbErr) {
      console.error("DB upsert cliente falhou:", dbErr)
      return NextResponse.json({ error: "DB upsert cliente falhou", details: String(dbErr) }, { status: 500 })
    }

    // Clerk role assign or invite
    try {
      const client = await clerkClient();
      let targetId = data.clerkUserId;
      if (!targetId) {
        try {
          const found = await client.users.getUserList({ emailAddress: [data.email], limit: 1 });
          targetId = found.data?.[0]?.id;
        } catch (searchErr) {
          console.error("Clerk user search cliente falhou:", searchErr)
          return NextResponse.json({ error: "Clerk user search falhou", details: String(searchErr) }, { status: 500 })
        }
      }
      if (targetId) {
        try {
          await client.users.updateUserMetadata(targetId, { publicMetadata: { role: "CLIENTE" } });
        } catch (metaErr) {
          console.error("Clerk updateUserMetadata cliente falhou:", metaErr)
          return NextResponse.json({ error: "Clerk updateUserMetadata falhou", details: String(metaErr) }, { status: 500 })
        }
      } else {
        const parts = data.nome.trim().split(/\s+/);
        const firstName = parts[0] ?? data.nome;
        const lastName = parts.slice(1).join(" ") || null;
        try {
          await client.users.createUser({ emailAddress: [data.email], firstName, lastName: lastName ?? undefined, publicMetadata: { role: "CLIENTE" } });
        } catch (createErr) {
          console.error("Clerk createUser cliente falhou:", createErr)
          if (createErr && typeof createErr === 'object' && 'status' in createErr && (createErr as { status?: number }).status === 422) {
            try {
              const inv = await client.invitations.createInvitation({ emailAddress: data.email, publicMetadata: { role: "CLIENTE" } });
              console.log("Clerk invitation cliente criada:", { id: inv.id, email: inv.emailAddress, status: inv.status })
            } catch (inviteErr) {
              console.error("Clerk createInvitation cliente falhou:", inviteErr)
              return NextResponse.json({ error: "Clerk createUser e createInvitation falharam", details: String(inviteErr) }, { status: 500 })
            }
          } else {
            return NextResponse.json({ error: "Clerk createUser falhou", details: String(createErr) }, { status: 500 })
          }
        }
      }
    } catch (outerClerkErr) {
      console.error("Clerk integração cliente falhou:", outerClerkErr)
      return NextResponse.json({ error: "Clerk integração cliente falhou", details: String(outerClerkErr) }, { status: 500 })
    }

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'ZodError') {
      const err = e as { errors?: unknown };
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
