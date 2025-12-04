"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Utensils, Search, Loader2, BookmarkIcon } from "lucide-react"
import { Navbar } from "@/components/navbar"

export default function RecipesPage() {
  const { user } = useAuth()
  const [recipes, setRecipes] = useState<any[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedCuisine, setSelectedCuisine] = useState("all")
  const [savedRecipes, setSavedRecipes] = useState<string[]>([])

  useEffect(() => {
    loadRecipes()
    if (user) {
      loadSavedRecipes()
    }
  }, [user])

  const loadRecipes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/recipes")
      if (!response.ok) throw new Error("Failed to load recipes")
      const data = await response.json()
      setRecipes(data.recipes || [])
      setFilteredRecipes(data.recipes || [])
    } catch (error) {
      console.error("[v0] Error loading recipes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSavedRecipes = async () => {
    try {
      const response = await fetch(`/api/recipes/saved`)
      if (response.ok) {
        const data = await response.json()
        setSavedRecipes(data.saved?.map((r: any) => r.recipe_id) || [])
      }
    } catch (error) {
      console.error("[v0] Error loading saved recipes:", error)
    }
  }

  useEffect(() => {
    let filtered = recipes

    if (searchTerm) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((recipe) => recipe.difficulty === selectedDifficulty)
    }

    if (selectedCuisine !== "all") {
      filtered = filtered.filter((recipe) => recipe.cuisine === selectedCuisine)
    }

    setFilteredRecipes(filtered)
  }, [searchTerm, selectedDifficulty, selectedCuisine, recipes])

  const handleSaveRecipe = async (recipeId: string) => {
    if (!user) {
      // Redirect to login
      window.location.href = "/login"
      return
    }

    try {
      const method = savedRecipes.includes(recipeId) ? "DELETE" : "POST"
      const response = await fetch("/api/recipes/saved", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, recipeId }),
      })

      if (response.ok) {
        setSavedRecipes((prev) =>
          prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId],
        )
      }
    } catch (error) {
      console.error("[v0] Error saving recipe:", error)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Utensils className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Recipe Collection</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Explore our curated collection of healthy recipes designed to support your fitness goals.
            </p>
          </div>

          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cuisine</label>
              <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cuisines</SelectItem>
                  <SelectItem value="asian">Asian</SelectItem>
                  <SelectItem value="mediterranean">Mediterranean</SelectItem>
                  <SelectItem value="latin">Latin</SelectItem>
                  <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
                  <SelectItem value="indian">Indian</SelectItem>
                  <SelectItem value="american">American</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recipes Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRecipes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No recipes found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => (
                <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden bg-muted">
                    {recipe.image ? (
                      <Image src={recipe.image || "/placeholder.svg"} alt={recipe.name} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Utensils className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => handleSaveRecipe(recipe.id)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <BookmarkIcon
                        className={`h-5 w-5 ${savedRecipes.includes(recipe.id) ? "fill-primary text-primary" : "text-muted-foreground"}`}
                      />
                    </button>
                  </div>

                  <CardContent className="pt-4">
                    <Link href={`/recipes/${recipe.id}`}>
                      <h3 className="font-semibold hover:text-primary transition-colors cursor-pointer mb-2">
                        {recipe.name}
                      </h3>
                    </Link>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {recipe.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recipe.cuisine}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Cal</div>
                        <div className="font-semibold">{Math.round(recipe.calories)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Pro</div>
                        <div className="font-semibold">{Math.round(recipe.protein)}g</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Carb</div>
                        <div className="font-semibold">{Math.round(recipe.carbs)}g</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Fat</div>
                        <div className="font-semibold">{Math.round(recipe.fat)}g</div>
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-4 pt-0">
                    <Link href={`/recipes/${recipe.id}`} className="w-full">
                      <Button className="w-full bg-transparent" variant="outline">
                        View Recipe
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
