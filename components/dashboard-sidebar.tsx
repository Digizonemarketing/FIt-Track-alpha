"use client"

import { usePathname } from "next/navigation"

import { useRouter } from "next/navigation"

import { Sparkles } from "lucide-react"
// ... existing imports ...

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()

  const sidebarItems = [
    {
      label: "AI Suggestions",
      href: "/dashboard/ai-suggestions",
      icon: Sparkles,
      description: "Get AI meal plans and workouts",
    },
    // ... rest of items ...
  ]
}
