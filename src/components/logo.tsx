import Link from "next/link"
import { Scissors } from "lucide-react"

export function Logo({ text, href = "/" }: { text: string; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold">
      <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
        <Scissors className="size-4" />
      </span>
      {text}
    </Link>
  )
}
