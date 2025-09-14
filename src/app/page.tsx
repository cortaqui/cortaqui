import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { findUsuarioByEmail } from "~/server/db/queries";

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return redirect("/login");

  const claims = sessionClaims as unknown as { metadata?: { role?: string } } | undefined;
  const claimsRole = claims?.metadata?.role?.toString().toUpperCase();

  // Prefer DB role if available to avoid stale Clerk metadata
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress;
  let dbRole: string | undefined = undefined;
  if (email) {
    const row = await findUsuarioByEmail(email);
    dbRole = (row?.tipoUsuario as string | undefined)?.toUpperCase();
  }
  const role = (dbRole ?? claimsRole ?? "CLIENTE").toUpperCase();

  if (role === "ADMIN") return redirect("/admin/dashboard");
  if (role === "BARBEIRO") return redirect("/barbeiro/agenda");
  return redirect("/agendar");
}
