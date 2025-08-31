import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId, sessionClaims } = await auth();
  const claims = sessionClaims as unknown as { metadata?: { role?: string } } | undefined;
  const role = claims?.metadata?.role?.toString().toUpperCase();
  if (!userId) return redirect("/login");
  if (role === "ADMIN") return redirect("/admin/dashboard");
  return redirect("/agendar");
}
