"use client"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { Button } from "~/components/ui/button"

export function ClerkAuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <SignedIn>
        <UserButton afterSignOutUrl="/login" />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal" fallbackRedirectUrl="/auth/redirect" forceRedirectUrl="/auth/redirect">
          <Button variant="outline" size="sm" className="from-green-300 to-emerald-400 bg-gradient-to-r text-white border-0">Entrar</Button>
        </SignInButton>
        <SignUpButton mode="modal" fallbackRedirectUrl="/auth/redirect" forceRedirectUrl="/auth/redirect">
          <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">Registrar</Button>
        </SignUpButton>
      </SignedOut>
    </div>
  )
}
