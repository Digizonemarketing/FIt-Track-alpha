"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export function UserNav() {
  const router = useRouter()
  const { user } = useAuth()
  const [userData, setUserData] = useState<{
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

        if (error) {
          console.error("[v0] Error fetching user data:", error)
          throw error
        }

        if (data) {
          setUserData({
            first_name: data.first_name || "User",
            last_name: data.last_name || "",
            email: data.email || user.email || "",
            avatar_url: data.avatar_url || null,
          })
        } else {
          // User record doesn't exist yet - use auth data
          setUserData({
            first_name: user.email?.split("@")[0] || "User",
            last_name: "",
            email: user.email || "",
            avatar_url: null,
          })
        }
      } catch (error) {
        console.error("[v0] Error fetching user data:", error)
        setUserData({
          first_name: user.email?.split("@")[0] || "User",
          last_name: "",
          email: user.email || "",
          avatar_url: null,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user?.id, user?.email])

  const getInitials = () => {
    if (!userData) return "U"
    const first = userData.first_name?.charAt(0) || "U"
    const last = userData.last_name?.charAt(0) || ""
    return (first + last).toUpperCase()
  }

  const displayName = userData ? `${userData.first_name} ${userData.last_name}`.trim() : "Loading..."
  const displayEmail = userData?.email || "user@example.com"
  const avatarUrl = userData?.avatar_url

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={displayName} />}
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>Profile</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/")}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
