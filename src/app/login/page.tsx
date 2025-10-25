"use client"

import { Scissors } from "lucide-react"
import { SignIn } from "@clerk/nextjs"
import { useIsMobile } from "~/hooks/use-mobile"

export default function LoginPage() {
  const isMobile = useIsMobile()

  return (
    <div className="grid min-h-svh lg:grid-cols-2 overflow-hidden">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Scissors className="size-4" />
            </div>
            Cortaqui.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md md:max-w-xs text-center">
            <SignIn routing="hash" />
          </div>
        </div>
      </div>
      {!isMobile && (
        <div className="bg-muted relative hidden lg:block">
          <img
            src="/login.png"
            alt="Image"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      )}
    </div>
  )
}
