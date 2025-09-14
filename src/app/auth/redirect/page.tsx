import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { findUsuarioByEmail } from "~/server/db/queries"

export default async function AuthRedirectPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    redirect('/login')
  }

  const claims = sessionClaims as unknown as { metadata?: { role?: string } } | undefined
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress
  let role: string | undefined = undefined
  if (email) {
    const row = await findUsuarioByEmail(email)
    const dbRole = row?.tipoUsuario
    role = typeof dbRole === 'string' ? dbRole.toUpperCase() : undefined
  }
  if (!role) {
    const raw = claims?.metadata?.role ?? undefined
    role = typeof raw === 'string' ? raw.toUpperCase() : undefined
  }

  if (role === 'ADMIN') {
    redirect('/admin/dashboard')
  }
  if (role === 'BARBEIRO') {
    redirect('/barbeiro/agenda')
  }

  // Default CLIENTE and unknown roles to /agendar
  redirect('/agendar')
}
