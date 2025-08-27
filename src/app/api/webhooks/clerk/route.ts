import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { usuario } from "~/server/db/schema";
import type { UserRole as AppRole } from "~/lib/auth";
import { eq } from "drizzle-orm";
import { env } from "~/env";

export const runtime = "nodejs";

type ClerkEmailAddress = { id: string; email_address: string };
type ClerkPhoneNumber = { id: string; phone_number: string };
type ClerkUserPayload = {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  primary_email_address_id?: string | null;
  phone_numbers?: ClerkPhoneNumber[];
  primary_phone_number_id?: string | null;
  public_metadata?: Record<string, unknown> | null;
  private_metadata?: Record<string, unknown> | null;
  unsafe_metadata?: Record<string, unknown> | null;
  username?: string | null;
};

type ClerkDeletedPayload = { id?: string } & Partial<ClerkUserPayload>;

// AppRole comes from our auth types

export async function POST(req: NextRequest) {
  const secret = env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(secret);

  type ClerkEvent = { type: string; data: unknown };
  function isClerkEvent(value: unknown): value is ClerkEvent {
    if (!value || typeof value !== "object") return false;
    const v = value as { type?: unknown; data?: unknown };
    return typeof v.type === "string" && "data" in v;
  }
  let evt: ClerkEvent;
  try {
    const verified = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    if (!isClerkEvent(verified)) {
      return NextResponse.json({ error: "Unexpected webhook payload" }, { status: 400 });
    }
    evt = verified;
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt.data as ClerkUserPayload);
        break;
      case "user.updated":
        await handleUserUpdated(evt.data as ClerkUserPayload);
        break;
      case "user.deleted":
        await handleUserDeleted(evt.data as ClerkDeletedPayload);
        break;
      default:
        // no-op for unhandled events
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("Error handling Clerk webhook:", { eventType, message, stack });
    const body = env.NODE_ENV !== "production" ? { error: message, eventType } : { error: "Handler error" };
    return NextResponse.json(body, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handleUserCreated(data: ClerkUserPayload) {
  const { first_name, last_name, username } = data;
  const email = getPrimaryEmail(data);
  if (!email) return;

  const joined = [first_name, last_name].filter((x) => typeof x === "string" && x).join(" ");
  const fullName = (joined && joined.trim().length > 0 ? joined : (username ?? "")) || "Usuário";
  const phone = getPrimaryPhone(data);
  const role = parseRoleFromMetadata(data) ?? ("CLIENTE" as AppRole);

  try {
    const existing = await db
      .select({ id: usuario.userId })
      .from(usuario)
      .where(eq(usuario.email, email))
      .limit(1);

    if (existing.length === 0) {
      await db
        .insert(usuario)
        .values({
          nome: fullName,
          email,
          telefone: phone ?? undefined,
          tipoUsuario: role,
          hashSenha: "clerk-managed",
        });
    } else {
      await db
        .update(usuario)
        .set({
          nome: fullName,
          telefone: phone ?? undefined,
          tipoUsuario: role,
        })
        .where(eq(usuario.email, email));
    }
  } catch (err) {
    console.error("DB upsert failed for Clerk user:", { email, err });
    throw err;
  }

  // Ensure Clerk user has the correct role in public metadata for session claims
  try {
    type UsersClient = {
      updateUser?: (id: string, args: { publicMetadata?: Record<string, unknown> }) => Promise<unknown>;
      updateUserMetadata?: (id: string, args: { publicMetadata?: Record<string, unknown> }) => Promise<unknown>;
      getUser?: (id: string) => Promise<unknown>;
      getUserList?: (args: Record<string, unknown>) => Promise<{ data?: Array<{ id: string }> } | Array<{ id: string }>>;
    };
    async function getUsersClient(): Promise<UsersClient> {
      const anyClient = clerkClient as unknown;
      if (typeof anyClient === "function") {
        const resolved = await (anyClient as () => Promise<{ users: UsersClient }>)();
        return resolved.users;
      }
      return (anyClient as { users: UsersClient }).users;
    }
    const users = await getUsersClient();

    async function tryUpdateById(userId: string) {
      if (typeof users.updateUser === "function") {
        await users.updateUser(userId, { publicMetadata: { role } });
        return true;
      }
      if (typeof users.updateUserMetadata === "function") {
        await users.updateUserMetadata(userId, { publicMetadata: { role } });
        return true;
      }
      return false;
    }

    let updated = false;
    try {
      updated = await tryUpdateById(data.id);
    } catch (e: unknown) {
      const httpStatus = (e as { status?: number }).status;
      if (httpStatus !== 404) throw e;
      // 404: try to resolve user by email and update that id
      const email = getPrimaryEmail(data);
      if (email && typeof users.getUserList === "function") {
        const list = await users.getUserList({ emailAddress: [email], limit: 1 });
        const arr = Array.isArray(list) ? list : list?.data ?? [];
        const found = arr?.[0]?.id;
        if (found) {
          await tryUpdateById(found);
          updated = true;
        }
      }
      if (!updated) {
        console.warn("Clerk metadata update skipped: user not found in current instance", { id: data.id });
      }
    }
  } catch (err) {
    console.error("Failed to update Clerk publicMetadata for user:", { userId: data.id, err });
    // ignore metadata update failures to avoid failing the webhook
  }
}

async function handleUserUpdated(data: ClerkUserPayload) {
  // For our schema, an upsert by unique email covers updates as well
  await handleUserCreated(data);
}

async function handleUserDeleted(data: ClerkDeletedPayload) {
  // Best-effort soft delete by email if present in payload
  const email = getPrimaryEmail(data);
  if (!email) return;
  // The current DB schema does not include deleted_at; perform hard delete instead
  await db.delete(usuario).where(eq(usuario.email, email));
}

function getPrimaryEmail(data: ClerkUserPayload | ClerkDeletedPayload): string | undefined {
  const { email_addresses, primary_email_address_id } = data;
  if (!email_addresses || email_addresses.length === 0) return undefined;
  const byId = email_addresses.find((e) => e.id === primary_email_address_id);
  return (byId ?? email_addresses[0])?.email_address;
}

function getPrimaryPhone(data: ClerkUserPayload): string | null {
  const { phone_numbers, primary_phone_number_id } = data;
  if (!phone_numbers || phone_numbers.length === 0) return null;
  const byId = phone_numbers.find((p) => p.id === primary_phone_number_id);
  return (byId ?? phone_numbers[0])?.phone_number ?? null;
}

function parseRoleFromMetadata(data: ClerkUserPayload): AppRole | null {
  const fromPublic = (data.public_metadata?.role ?? data.public_metadata?.Role) as string | undefined;
  const fromPrivate = (data.private_metadata?.role ?? data.private_metadata?.Role) as string | undefined;
  const fromUnsafe = (data.unsafe_metadata?.role ?? data.unsafe_metadata?.Role) as string | undefined;
  const candidate = ((fromPublic ?? fromPrivate ?? fromUnsafe) ?? "").toString().toUpperCase();
  if (candidate === "ADMIN" || candidate === "BARBEIRO" || candidate === "CLIENTE") return candidate;
  return null;
}
