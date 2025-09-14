"use client"
import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet"
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "~/components/ui/sidebar"

export type NavItem = { title: string; url: string; icon?: React.ComponentType<{ className?: string }> }

export function MobileNavSheet({ label = "Menu", items }: { label?: string; items: NavItem[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    // Close the sheet on route change to avoid stale overlays and scroll locks
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger aria-label="Abrir menu">
        <Menu className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <SidebarProvider>
          <div className="mt-4">
            <SidebarGroup>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} onClick={() => setOpen(false)}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </div>
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  )
}
