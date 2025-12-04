"use client"

import { useState, type ReactNode } from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { Dumbbell, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardShellProps {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">FitTrack</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <ModeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 mt-16 w-72 transform border-r bg-background transition-transform duration-300 ease-in-out md:relative md:z-0 md:mt-0",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            !sidebarOpen && "md:-translate-x-full md:w-0 md:border-0",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto py-6 px-4">
              <DashboardNav closeSidebar={() => setMobileSidebarOpen(false)} />
            </div>
            <div className="border-t p-4">
              <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
                <h4 className="mb-1.5 text-sm font-semibold">Need help?</h4>
                <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
                  Check our help center or contact support for assistance.
                </p>
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/support">Get Support</Link>
                </Button>
              </div>
            </div>
          </div>
        </aside>

        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            sidebarOpen ? "md:ml-0" : "md:ml-0",
          )}
        >
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
