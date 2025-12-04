"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Clock, Users, Flame, Loader2, ArrowLeft } from "lucide-react"

export default function RecipeDetailPage() {
  const params = useParams()
  const recipeId = params.id as string
  const [recipe, setRecipe] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/recipes/${recipeId}`)
        if (!response.ok) throw new Error("Failed to load recipe")
        const data = await response.json()
        setRecipe(data.recipe)
      } catch (error) {
        console.error("[v0] Error loading recipe:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecipe()
  }, [recipeId])

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    )
  }

  if (!recipe) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold">Recipe not found</h3>
              <Button asChild className="mt-4">
                <Link href="/recipes">Back to Recipes</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
          {/* Back Button */}
          <Link href="/recipes" className="mb-6">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </Button>
          </Link>

          {/* Recipe Header */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              {recipe.image ? (
                <Image
                  src={recipe.image || "/placeholder.svg"}
                  alt={recipe.name}
                  width={600}
                  height={400}
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                  <Flame className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-4">{recipe.name}</h1>
                <p className="text-lg text-muted-foreground">{recipe.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="capitalize">{recipe.difficulty}</Badge>
                <Badge variant="secondary" className="capitalize">
                  {recipe.cuisine}
                </Badge>
                {recipe.dietary_tags?.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <Clock className="h-6 w-6 text-primary mb-2" />
                      <div className="text-2xl font-bold">{recipe.prep_time + recipe.cook_time} min</div>
                      <div className="text-sm text-muted-foreground">Total Time</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <Users className="h-6 w-6 text-primary mb-2" />
                      <div className="text-2xl font-bold">{recipe.servings}</div>
                      <div className="text-sm text-muted-foreground">Servings</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <Flame className="h-6 w-6 text-primary mb-2" />
                      <div className="text-2xl font-bold">{Math.round(recipe.calories)}</div>
                      <div className="text-sm text-muted-foreground">kcal/serving</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Nutrition Facts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nutrition Facts (per serving)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{Math.round(recipe.protein)}</div>
                  <div className="text-sm text-muted-foreground">Protein (g)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">{Math.round(recipe.carbs)}</div>
                  <div className="text-sm text-muted-foreground">Carbs (g)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">{Math.round(recipe.fat)}</div>
                  <div className="text-sm text-muted-foreground">Fat (g)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{Math.round(recipe.calories)}</div>
                  <div className="text-sm text-muted-foreground">Calories</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingredients and Instructions */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {Array.isArray(recipe.ingredients) &&
                    recipe.ingredients.map((ingredient: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span>{ingredient}</span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{recipe.instructions}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
