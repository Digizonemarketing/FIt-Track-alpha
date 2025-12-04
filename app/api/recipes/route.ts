import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const search = request.nextUrl.searchParams.get("search") || ""
    const cuisine = request.nextUrl.searchParams.get("cuisine") || "all"
    const dietary = request.nextUrl.searchParams.get("dietary") || "all"

    let query = supabase.from("recipes").select("*")

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    if (cuisine && cuisine !== "all") {
      query = query.ilike("cuisine", `%${cuisine}%`)
    }

    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching recipes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by dietary tags if specified
    let filteredData = data || []
    if (dietary && dietary !== "all") {
      filteredData = filteredData.filter((recipe: any) =>
        recipe.dietary_tags?.some((tag: string) => tag.toLowerCase().includes(dietary.toLowerCase())),
      )
    }

    return NextResponse.json(filteredData)
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch recipes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
