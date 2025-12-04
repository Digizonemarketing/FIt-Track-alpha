"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Filter, Dumbbell, Flame, Target, Info, ChevronRight, X, Loader2 } from "lucide-react"
import type { Exercise } from "@/types/workout"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const categories = [
  { value: "all", label: "All Categories" },
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "flexibility", label: "Flexibility" },
  { value: "hiit", label: "HIIT" },
  { value: "core", label: "Core" },
  { value: "balance", label: "Balance" },
]

const difficultyLevels = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

const muscleGroups = [
  { value: "all", label: "All Muscles" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "biceps", label: "Biceps" },
  { value: "triceps", label: "Triceps" },
  { value: "legs", label: "Legs" },
  { value: "glutes", label: "Glutes" },
  { value: "core", label: "Core" },
  { value: "full-body", label: "Full Body" },
]

const categoryColors: Record<string, string> = {
  strength: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cardio: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  flexibility: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  hiit: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  core: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  balance: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-green-500",
  intermediate: "bg-yellow-500",
  advanced: "bg-red-500",
}

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: Exercise) => void
  selectable?: boolean
}

export function ExerciseLibrary({ onSelectExercise, selectable = false }: ExerciseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedMuscle, setSelectedMuscle] = useState("all")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Build query params
  const queryParams = new URLSearchParams()
  if (selectedCategory !== "all") queryParams.append("category", selectedCategory)
  if (selectedDifficulty !== "all") queryParams.append("difficulty", selectedDifficulty)
  if (selectedMuscle !== "all") queryParams.append("muscle", selectedMuscle)
  if (searchQuery) queryParams.append("search", searchQuery)

  const { data, isLoading } = useSWR(`/api/workouts/exercises?${queryParams.toString()}`, fetcher)

  const exercises: Exercise[] = data?.exercises || []

  // Filter exercises client-side for immediate feedback
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      if (searchQuery && !exercise.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
  }, [exercises, searchQuery])

  const handleExerciseClick = (exercise: Exercise) => {
    if (selectable && onSelectExercise) {
      onSelectExercise(exercise)
    } else {
      setSelectedExercise(exercise)
    }
  }

  const activeFilters = [
    selectedCategory !== "all" && selectedCategory,
    selectedDifficulty !== "all" && selectedDifficulty,
    selectedMuscle !== "all" && selectedMuscle,
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-muted" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory("all")
                setSelectedDifficulty("all")
                setSelectedMuscle("all")
              }}
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="animate-fadeIn">
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Muscle Group</label>
                <Select value={selectedMuscle} onValueChange={setSelectedMuscle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select muscle" />
                  </SelectTrigger>
                  <SelectContent>
                    {muscleGroups.map((muscle) => (
                      <SelectItem key={muscle.value} value={muscle.value}>
                        {muscle.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filter Tags */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {selectedCategory}
              <button onClick={() => setSelectedCategory("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedDifficulty !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {selectedDifficulty}
              <button onClick={() => setSelectedDifficulty("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedMuscle !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {selectedMuscle}
              <button onClick={() => setSelectedMuscle("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{isLoading ? "Loading..." : `${filteredExercises.length} exercises found`}</span>
      </div>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredExercises.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className={`group overflow-hidden transition-all hover:shadow-md ${selectable ? "cursor-pointer" : ""}`}
              onClick={() => handleExerciseClick(exercise)}
            >
              {/* Exercise Image */}
              {exercise.image_url && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={exercise.image_url || "/placeholder.svg"}
                    alt={exercise.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {exercise.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className={categoryColors[exercise.category] || ""}>
                        {exercise.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            difficultyColors[exercise.difficulty_level] || "bg-gray-500"
                          }`}
                        />
                        <span className="text-xs text-muted-foreground capitalize">{exercise.difficulty_level}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {exercise.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{exercise.description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {exercise.muscle_groups?.slice(0, 3).map((muscle, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                  {exercise.muscle_groups && exercise.muscle_groups.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{exercise.muscle_groups.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {exercise.equipment && (
                    <span className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {exercise.equipment}
                    </span>
                  )}
                  {exercise.calories_per_10_min > 0 && (
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      {exercise.calories_per_10_min} cal/10min
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Exercise Detail Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={() => setSelectedExercise(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedExercise && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedExercise.name}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={categoryColors[selectedExercise.category] || ""}>
                      {selectedExercise.category}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {selectedExercise.difficulty_level}
                    </Badge>
                    {selectedExercise.equipment && <Badge variant="outline">{selectedExercise.equipment}</Badge>}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Image */}
                {selectedExercise.image_url && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={selectedExercise.image_url || "/placeholder.svg"}
                      alt={selectedExercise.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                {selectedExercise.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedExercise.description}</p>
                  </div>
                )}

                {/* Target Muscles */}
                {selectedExercise.muscle_groups && selectedExercise.muscle_groups.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Target Muscles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.muscle_groups.map((muscle, i) => (
                        <Badge key={i} variant="secondary">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {selectedExercise.instructions && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Instructions
                    </h4>
                    <div className="text-muted-foreground whitespace-pre-line">{selectedExercise.instructions}</div>
                  </div>
                )}

                {/* Variations */}
                {selectedExercise.variations && selectedExercise.variations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Variations</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      {selectedExercise.variations.map((variation, i) => (
                        <li key={i}>{variation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedExercise.calories_per_10_min > 0 && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4 text-center">
                        <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                        <p className="text-2xl font-bold">{selectedExercise.calories_per_10_min}</p>
                        <p className="text-xs text-muted-foreground">calories per 10 min</p>
                      </CardContent>
                    </Card>
                  )}
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <Dumbbell className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold capitalize">{selectedExercise.equipment || "None"}</p>
                      <p className="text-xs text-muted-foreground">equipment needed</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
