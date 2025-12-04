"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Heart,
  Clock,
  Users,
  Bookmark,
  Search,
  Filter,
  ChefHat,
  Loader2,
  ExternalLink,
  Sparkles,
  X,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Flame,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react"
import useSWR from "swr"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    console.error("[v0] Fetch error:", res.status, res.statusText)
    const error = new Error("Failed to fetch recipes")
    throw error
  }
  return res.json()
}

const cuisineOptions = [
  "All",
  "American",
  "Asian",
  "British",
  "Caribbean",
  "Chinese",
  "French",
  "Indian",
  "Italian",
  "Japanese",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Nordic",
  "South American",
  "South East Asian",
]

const mealTypeOptions = ["All", "Breakfast", "Lunch", "Dinner", "Snack"]

export default function RecipeLibraryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCuisine, setSelectedCuisine] = useState("all")
  const [selectedMealType, setSelectedMealType] = useState("all")
  const [maxCalories, setMaxCalories] = useState([800])
  const [maxTime, setMaxTime] = useState([60])
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [savingRecipes, setSavingRecipes] = useState<Record<string, boolean>>({})

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const getUserId = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session?.user?.id) {
          router.push("/login")
          return
        }

        setUserId(data.session.user.id)
      } catch (err) {
        console.error("[v0] Error:", err)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    getUserId()
  }, [router])

  // Fetch Edamam recipes based on user preferences
  const edamamUrl = userId
    ? `/api/recipes/edamam?userId=${userId}&query=${debouncedQuery || "healthy"}&cuisine=${selectedCuisine}&mealType=${selectedMealType === "all" ? "" : selectedMealType}&maxCalories=${maxCalories[0]}&maxTime=${maxTime[0]}`
    : null

  const {
    data: edamamRecipes = [],
    isLoading: isLoadingEdamam,
    mutate: refetchEdamam,
  } = useSWR(edamamUrl, fetcher, {
    revalidateOnFocus: false,
  })

  // Fetch saved recipes
  const { data: savedRecipesData, mutate: mutateSavedRecipes } = useSWR(
    userId ? `/api/recipes/saved?userId=${userId}` : null,
    fetcher,
  )

  const savedRecipes = savedRecipesData?.recipes || []

  // Check if a recipe is saved
  const isRecipeSaved = useCallback(
    (recipeId: string) => {
      return savedRecipes.some((r: any) => r.recipe_id === recipeId)
    },
    [savedRecipes],
  )

  // Save a recipe
  const handleSaveRecipe = async (recipe: any) => {
    if (!userId) return

    const recipeId = recipe.id || recipe.recipe_id
    setSavingRecipes((prev) => ({ ...prev, [recipeId]: true }))

    try {
      if (isRecipeSaved(recipeId)) {
        // Unsave
        const response = await fetch(`/api/recipes/saved?userId=${userId}&recipeId=${recipeId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          toast({
            title: "Recipe removed",
            description: "Recipe has been removed from your saved list.",
          })
          mutateSavedRecipes()
        } else {
          throw new Error("Failed to remove recipe")
        }
      } else {
        // Save
        const response = await fetch("/api/recipes/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, recipe }),
        })
        if (response.ok) {
          toast({
            title: "Recipe saved!",
            description: "Recipe has been added to your saved list.",
          })
          mutateSavedRecipes()
        } else {
          throw new Error("Failed to save recipe")
        }
      }
    } catch (err) {
      console.error("[v0] Error saving recipe:", err)
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingRecipes((prev) => ({ ...prev, [recipeId]: false }))
    }
  }

  const handleSearch = useCallback(() => {
    setIsSearching(true)
    refetchEdamam().finally(() => setIsSearching(false))
  }, [refetchEdamam])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCuisine("all")
    setSelectedMealType("all")
    setMaxCalories([800])
    setMaxTime([60])
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Recipe Library" text="Discover personalized recipes powered by Edamam AI.">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="h-3 w-3" />
            2.3M+ Recipes
          </Badge>
          <Button variant="outline" onClick={() => router.push("/dashboard/meal-plans")}>
            <ChefHat className="mr-2 h-4 w-4" />
            Meal Plans
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/diet-plan")}>
            <ChefHat className="mr-2 h-4 w-4" />
            Diet Plan
          </Button>
        </div>
      </DashboardHeader>

      <Tabs defaultValue="discover" className="space-y-4">
        <TabsList>
          <TabsTrigger value="discover" className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-1.5">
            <Heart className="h-4 w-4" />
            Saved ({savedRecipes.length})
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Trending
          </TabsTrigger>
        </TabsList>

        {/* DISCOVER TAB */}
        <TabsContent value="discover" className="space-y-4">
          {/* Search & Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search Recipes
                  </CardTitle>
                  <CardDescription>Find recipes matching your dietary needs and preferences</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  Powered by Edamam
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipes, ingredients, or cuisines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-1.5" />
                  Filters
                </Button>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-2">
                    <Label>Cuisine</Label>
                    <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        {cuisineOptions.map((cuisine) => (
                          <SelectItem key={cuisine} value={cuisine.toLowerCase()}>
                            {cuisine}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Meal Type</Label>
                    <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                      <SelectContent>
                        {mealTypeOptions.map((type) => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Calories: {maxCalories[0]} kcal</Label>
                    <Slider value={maxCalories} onValueChange={setMaxCalories} min={200} max={1500} step={50} />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Prep Time: {maxTime[0]} min</Label>
                    <Slider value={maxTime} onValueChange={setMaxTime} min={10} max={120} step={5} />
                  </div>

                  <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1.5" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Cuisine Buttons */}
              <div className="flex flex-wrap gap-2">
                {["Italian", "Asian", "Mexican", "Mediterranean", "Indian", "American"].map((cuisine) => (
                  <Button
                    key={cuisine}
                    variant={selectedCuisine === cuisine.toLowerCase() ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCuisine(cuisine.toLowerCase())
                      handleSearch()
                    }}
                  >
                    {cuisine}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipe Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingEdamam ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : edamamRecipes.length > 0 ? (
              edamamRecipes.map((recipe: any) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isSaved={isRecipeSaved(recipe.id)}
                  isSaving={savingRecipes[recipe.id]}
                  onSave={() => handleSaveRecipe(recipe)}
                  onSelect={() => setSelectedRecipe(recipe)}
                />
              ))
            ) : (
              <div className="col-span-full">
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                  <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recipes Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search or filters to find more recipes.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Filters
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        {/* SAVED TAB */}
        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Saved Recipes
              </CardTitle>
              <CardDescription>Recipes you&apos;ve saved for later</CardDescription>
            </CardHeader>
            <CardContent>
              {savedRecipes.length > 0 ? (
                <div className="space-y-2">
                  {savedRecipes.map((recipe: any) => (
                    <SavedRecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isSaving={savingRecipes[recipe.recipe_id]}
                      onSave={() => handleSaveRecipe({ ...recipe, id: recipe.recipe_id })}
                      onSelect={() => setSelectedRecipe(recipe)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Saved Recipes</h3>
                  <p className="mb-4">Start saving recipes you like to access them here!</p>
                  <Button variant="outline" onClick={() => {}}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Discover Recipes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRENDING TAB */}
        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Recipes
              </CardTitle>
              <CardDescription>Popular recipes this week</CardDescription>
            </CardHeader>
            <CardContent>
              {edamamRecipes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {edamamRecipes.slice(0, 6).map((recipe: any) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isSaved={isRecipeSaved(recipe.id)}
                      isSaving={savingRecipes[recipe.id]}
                      onSave={() => handleSaveRecipe(recipe)}
                      onSelect={() => setSelectedRecipe(recipe)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trending recipes available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recipe Detail Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  {selectedRecipe.image && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={selectedRecipe.image || "/placeholder.svg"}
                        alt={selectedRecipe.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selectedRecipe.name}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="secondary">{selectedRecipe.cuisine || "International"}</Badge>
                      {selectedRecipe.meal_type && <Badge variant="outline">{selectedRecipe.meal_type}</Badge>}
                      {selectedRecipe.difficulty && <Badge variant="outline">{selectedRecipe.difficulty}</Badge>}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Quick Stats */}
                <div className="flex items-center gap-4 text-sm">
                  {selectedRecipe.prep_time > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedRecipe.prep_time} min</span>
                    </div>
                  )}
                  {selectedRecipe.servings && (
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedRecipe.servings} servings</span>
                    </div>
                  )}
                  {selectedRecipe.source && (
                    <span className="text-muted-foreground">Source: {selectedRecipe.source}</span>
                  )}
                </div>

                {/* Nutrition Grid */}
                <div>
                  <h4 className="font-semibold mb-3">Nutrition per Serving</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-lg bg-primary/10">
                      <Flame className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-lg font-bold">{selectedRecipe.calories}</p>
                      <p className="text-xs text-muted-foreground">Calories</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-500/10">
                      <p className="text-lg font-bold text-blue-600">{selectedRecipe.protein}g</p>
                      <p className="text-xs text-muted-foreground">Protein</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-500/10">
                      <p className="text-lg font-bold text-amber-600">{selectedRecipe.carbs}g</p>
                      <p className="text-xs text-muted-foreground">Carbs</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-rose-500/10">
                      <p className="text-lg font-bold text-rose-600">{selectedRecipe.fat}g</p>
                      <p className="text-xs text-muted-foreground">Fat</p>
                    </div>
                  </div>
                </div>

                {/* Dietary Tags */}
                {selectedRecipe.dietary_tags?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Dietary Information</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecipe.dietary_tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ingredients */}
                {selectedRecipe.ingredients?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Ingredients</h4>
                    <ScrollArea className="h-48">
                      <ul className="space-y-2">
                        {selectedRecipe.ingredients.map((ingredient: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSaveRecipe(selectedRecipe)}
                  disabled={savingRecipes[selectedRecipe.id || selectedRecipe.recipe_id]}
                >
                  {savingRecipes[selectedRecipe.id || selectedRecipe.recipe_id] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isRecipeSaved(selectedRecipe.id || selectedRecipe.recipe_id) ? (
                    <BookmarkCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                  )}
                  {isRecipeSaved(selectedRecipe.id || selectedRecipe.recipe_id) ? "Saved" : "Save Recipe"}
                </Button>
                {selectedRecipe.source_url && (
                  <Button asChild>
                    <a href={selectedRecipe.source_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Recipe
                    </a>
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

// Recipe Card Component
function RecipeCard({
  recipe,
  isSaved,
  isSaving,
  onSave,
  onSelect,
}: {
  recipe: any
  isSaved: boolean
  isSaving?: boolean
  onSave: () => void
  onSelect: () => void
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer" onClick={onSelect}>
      <div className="relative h-48 bg-muted overflow-hidden">
        <Image
          src={recipe.image || "/placeholder.svg?height=200&width=300&query=healthy+food"}
          alt={recipe.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {recipe.dietary_tags?.slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Save Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background",
            isSaved && "text-red-500",
          )}
          onClick={(e) => {
            e.stopPropagation()
            onSave()
          }}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
          )}
        </Button>

        {/* Source badge */}
        {recipe.source && (
          <Badge className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm text-xs">{recipe.source}</Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-2">{recipe.name}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span className="capitalize">{recipe.cuisine || "International"}</span>
          {recipe.meal_type && (
            <>
              <span>-</span>
              <span className="capitalize">{recipe.meal_type}</span>
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Quick Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{recipe.prep_time || "N/A"}m</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{recipe.servings} servings</span>
          </div>
          {recipe.difficulty && (
            <Badge variant="outline" className="text-xs">
              {recipe.difficulty}
            </Badge>
          )}
        </div>

        {/* Nutrition */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Per serving</span>
            <span className="font-semibold">{recipe.calories} kcal</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="flex justify-between text-muted-foreground">
                <span>Protein</span>
                <span className="font-medium text-blue-600">{recipe.protein}g</span>
              </div>
              <Progress value={(recipe.protein / 50) * 100} className="h-1 [&>div]:bg-blue-600" />
            </div>
            <div>
              <div className="flex justify-between text-muted-foreground">
                <span>Carbs</span>
                <span className="font-medium text-amber-600">{recipe.carbs}g</span>
              </div>
              <Progress value={(recipe.carbs / 100) * 100} className="h-1 [&>div]:bg-amber-600" />
            </div>
            <div>
              <div className="flex justify-between text-muted-foreground">
                <span>Fat</span>
                <span className="font-medium text-rose-600">{recipe.fat}g</span>
              </div>
              <Progress value={(recipe.fat / 50) * 100} className="h-1 [&>div]:bg-rose-600" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SavedRecipeCard({
  recipe,
  isSaving,
  onSave,
  onSelect,
}: {
  recipe: any
  isSaving?: boolean
  onSave: () => void
  onSelect: () => void
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold line-clamp-1">{recipe.name}</h3>
          {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {recipe.dietary_tags.slice(0, 1).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {recipe.cuisine && <span className="capitalize">{recipe.cuisine}</span>}
          {recipe.meal_type && (
            <>
              <span>-</span>
              <span className="capitalize">{recipe.meal_type}</span>
            </>
          )}
          {recipe.prep_time && (
            <>
              <span>-</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{recipe.prep_time}m</span>
              </div>
            </>
          )}
          {recipe.calories && (
            <>
              <span>-</span>
              <div className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                <span>{recipe.calories} kcal</span>
              </div>
            </>
          )}
        </div>

        {recipe.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{recipe.description}</p>}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 text-red-500 hover:text-red-600"
        onClick={(e) => {
          e.stopPropagation()
          onSave()
        }}
        disabled={isSaving}
      >
        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5 fill-current" />}
      </Button>
    </div>
  )
}
