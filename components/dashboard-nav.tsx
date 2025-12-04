"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Calendar,
  Home,
  Settings,
  Utensils,
  User,
  Activity,
  Bell,
  BookOpen,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Sparkles,
  Dumbbell,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  badge?: string | number
  isActive: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, badge, isActive, onClick }: NavItemProps) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        className={cn(
          "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              isActive ? "bg-primary-foreground/20" : "bg-muted group-hover:bg-accent-foreground/10",
            )}
          >
            {icon}
          </div>
          <span>{label}</span>
        </div>
        {badge && (
          <Badge
            variant={isActive ? "secondary" : "secondary"}
            className={cn("ml-auto text-xs", isActive ? "bg-primary-foreground/20 text-primary-foreground" : "")}
          >
            {badge}
          </Badge>
        )}
      </div>
    </Link>
  )
}

interface NavGroupProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function NavGroup({ title, icon, children, defaultOpen = true }: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          {title}
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "rotate-0" : "-rotate-90")} />
      </button>
      <div
        className={cn(
          "mt-1 space-y-1 overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  )
}

interface DashboardNavProps {
  closeSidebar?: () => void
}

export function DashboardNav({ closeSidebar }: DashboardNavProps) {
  const pathname = usePathname()

  const { data: notificationCount } = useSWR("notification-count", async () => {
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user?.id) return 0

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.session.user.id)
        .eq("status", "unread")

      return count || 0
    } catch {
      return 0
    }
  })

  const { data: consultationCount } = useSWR("consultation-count", async () => {
    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user?.id) return 0

      const { count } = await supabase
        .from("consultations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.session.user.id)
        .eq("status", "scheduled")
        .gte("scheduled_date", new Date().toISOString())

      return count || 0
    } catch {
      return 0
    }
  })

  const handleClick = () => {
    if (closeSidebar && window.innerWidth < 768) {
      closeSidebar()
    }
  }

  return (
    <nav className="space-y-2">
      {/* Main Dashboard Link */}
      <div className="mb-4">
        <NavItem
          href="/dashboard"
          icon={<Home className="h-4 w-4" />}
          label="Dashboard"
          isActive={pathname === "/dashboard"}
          onClick={handleClick}
        />
      </div>

      <NavGroup title="Nutrition" icon={<Utensils className="h-3 w-3" />}>
        <NavItem
          href="/dashboard/diet-plan"
          icon={<Utensils className="h-4 w-4" />}
          label="Diet Plan"
          isActive={pathname === "/dashboard/diet-plan"}
          onClick={handleClick}
        />
        <NavItem
          href="/dashboard/nutrition"
          icon={<BarChart3 className="h-4 w-4" />}
          label="Nutrition Tracking"
          isActive={pathname === "/dashboard/nutrition"}
          onClick={handleClick}
        />
        <NavItem
          href="/dashboard/meal-calendar"
          icon={<Calendar className="h-4 w-4" />}
          label="Meal Calendar"
          isActive={pathname === "/dashboard/meal-calendar"}
          onClick={handleClick}
        />
        <NavItem
          href="/dashboard/recipes"
          icon={<BookOpen className="h-4 w-4" />}
          label="Recipe Library"
          isActive={pathname === "/dashboard/recipes"}
          onClick={handleClick}
        />
      </NavGroup>

      <NavGroup title="Fitness" icon={<Dumbbell className="h-3 w-3" />}>
        <NavItem
          href="/dashboard/workout-plan"
          icon={<Activity className="h-4 w-4" />}
          label="Workout Plan"
          isActive={pathname === "/dashboard/workout-plan"}
          onClick={handleClick}
        />
        <NavItem
          href="/dashboard/workout-calendar"
          icon={<Calendar className="h-4 w-4" />}
          label="Workout Calendar"
          isActive={pathname === "/dashboard/workout-calendar"}
          onClick={handleClick}
        />
      </NavGroup>

      <NavGroup title="AI & Consultations" icon={<Sparkles className="h-3 w-3" />}>
        <NavItem
          href="/dashboard/ai-consultant"
          icon={<Sparkles className="h-4 w-4" />}
          label="AI Consultant"
          isActive={pathname === "/dashboard/ai-consultant"}
          onClick={handleClick}
        />
        <NavItem
          href="/dashboard/consultations"
          icon={<MessageCircle className="h-4 w-4" />}
          label="Consultations"
          badge={consultationCount || undefined}
          isActive={pathname === "/dashboard/consultations"}
          onClick={handleClick}
        />
      </NavGroup>

      {/* Bottom section with user-related links */}
      <div className="pt-4 mt-4 border-t border-border/50 space-y-1">
        <NavItem
          href="/dashboard/notifications"
          icon={<Bell className="h-4 w-4" />}
          label="Notifications"
          badge={notificationCount || undefined}
          isActive={pathname === "/dashboard/notifications"}
          onClick={handleClick}
        />
        <NavItem
          href="/dashboard/profile"
          icon={<User className="h-4 w-4" />}
          label="Profile"
          isActive={pathname === "/dashboard/profile"}
          onClick={handleClick}
        />
        <NavItem
          href="/dashboard/settings"
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          isActive={pathname === "/dashboard/settings"}
          onClick={handleClick}
        />
        <NavItem
          href="/dashboard/support"
          icon={<HelpCircle className="h-4 w-4" />}
          label="Get Support"
          isActive={pathname === "/dashboard/support"}
          onClick={handleClick}
        />
      </div>
    </nav>
  )
}
