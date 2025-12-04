"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BookOpen, Search, Loader2, MoreVertical, Eye, Trash2, Heart, TrendingUp, ArrowLeft, Users } from "lucide-react"
import { format } from "date-fns"
import useSWR from "swr"
import Link from "next/link"
import Image from "next/image"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminRecipesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session?.user?.id) {
          router.push("/login")
          return
        }

        setIsAdmin(true)
      } catch (err) {
        console.error("[v0] Error:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Fetch all saved recipes (admin view)
  const { data: recipesData, isLoading: isLoadingRecipes } = useSWR(isAdmin ? "/api/admin/recipes" : null, fetcher)

  const savedRecipes = recipesData?.recipes || []

  // Stats
  const stats = {
    totalSaved: savedRecipes.length,
    uniqueUsers: new Set(savedRecipes.map((r: any) => r.user_id)).size,
    thisWeek: savedRecipes.filter((r: any) => {
      const savedDate = new Date(r.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return savedDate >= weekAgo
    }).length,
  }

  // Filter recipes based on search
  const filteredRecipes = savedRecipes.filter((recipe: any) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      recipe.name?.toLowerCase().includes(searchLower) ||
      recipe.cuisine?.toLowerCase().includes(searchLower) ||
      recipe.users?.email?.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Recipe Library Management
            </h1>
            <p className="text-muted-foreground">Monitor saved recipes and user preferences</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Saved Recipes</p>
                <p className="text-2xl font-bold">{stats.totalSaved}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saved This Week</p>
                <p className="text-2xl font-bold text-primary">{stats.thisWeek}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Saved Recipes</CardTitle>
              <CardDescription>View all recipes saved by users</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingRecipes ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRecipes.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipe</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Cuisine</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Saved On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.map((recipe: any) => (
                    <TableRow key={recipe.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {recipe.image && (
                            <div className="w-10 h-10 rounded overflow-hidden">
                              <Image
                                src={recipe.image || "/placeholder.svg"}
                                alt={recipe.name}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{recipe.name}</p>
                            <p className="text-xs text-muted-foreground">{recipe.source}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{recipe.users?.email || "Unknown"}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{recipe.cuisine || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{recipe.calories} kcal</TableCell>
                      <TableCell>{format(new Date(recipe.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No saved recipes found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
