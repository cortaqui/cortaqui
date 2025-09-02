"use client"
import { Menu } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "~/components/ui/sheet"
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "~/components/ui/sidebar"

export type NavItem = { title: string; url: string; icon?: React.ComponentType<{ className?: string }> }

export function MobileNavSheet({ label = "Menu", items }: { label?: string; items: NavItem[] }) {
  return (
    <Sheet>
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
                      <Link href={item.url}>
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
