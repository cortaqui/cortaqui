import { auth } from "@clerk/nextjs/server";

export type UserRole = "ADMIN" | "BARBEIRO" | "CLIENTE";

export type Permission =
  | "agendamento:read"
  | "agendamento:write"
  | "usuario:read"
  | "usuario:write"
  | "servico:read"
  | "servico:write"
  | "disponibilidade:read"
  | "disponibilidade:write"
  | "pagamento:write";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "agendamento:read",
    "agendamento:write",
    "usuario:read",
    "usuario:write",
    "servico:read",
    "servico:write",
    "disponibilidade:read",
    "disponibilidade:write",
    "pagamento:write",
  ],
  BARBEIRO: [
    "agendamento:read",
    "disponibilidade:read",
    "disponibilidade:write",
    "servico:read",
  ],
  CLIENTE: [
    "agendamento:read",
    "agendamento:write",
    "pagamento:write",
    "servico:read",
    "disponibilidade:read",
  ],
};

export async function getSession() {
  const session = await auth();
  return session;
}

type SessionClaims = { metadata?: { role?: string } } & { role?: string };

async function roleFromSession(): Promise<UserRole> {
  const { sessionClaims } = await auth();
  const claims = sessionClaims as unknown as SessionClaims | undefined;
  const raw = (claims?.metadata?.role ?? claims?.role ?? "CLIENTE");
  const upper = raw?.toString().toUpperCase();
  if (upper === "ADMIN" || upper === "BARBEIRO" || upper === "CLIENTE") return upper as UserRole;
  return "CLIENTE";
}

export async function getCurrentUserRole(): Promise<UserRole> {
  return await roleFromSession();
}

export async function hasPermission(permission: Permission) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("401: Não autorizado");
  }
  const role = await roleFromSession();
  const allowed = ROLE_PERMISSIONS[role].includes(permission);
  if (!allowed) {
    throw new Error("403: Proibido");
  }
}

// Back-compat thin wrappers
export async function assertHasPermission(permission: Permission) {
  return hasPermission(permission);
}

export async function assertHasAnyRole(roles: UserRole[]) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("401: Não autorizado");
  }
  const role = await roleFromSession();
  if (!roles.includes(role)) {
    throw new Error("403: Proibido");
  }
}
