"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ShoppingCart, ChevronDown, Download, Trash2, Check, Loader2 } from "lucide-react"

interface ShoppingListItem {
  id: string
  food: string
  quantity: number
  measure: string
  category: string
  checked: boolean
}

interface ShoppingList {
  id: string
  name: string
  created_at: string
  shopping_list_items: ShoppingListItem[]
}

interface ShoppingListProps {
  shoppingList: ShoppingList | null
  onToggleItem?: (itemId: string, checked: boolean) => Promise<void>
  onDeleteList?: (listId: string) => Promise<void>
}

export function ShoppingListComponent({ shoppingList, onToggleItem, onDeleteList }: ShoppingListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({})
  const [isExporting, setIsExporting] = useState(false)

  if (!shoppingList || !shoppingList.shopping_list_items?.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Shopping List</h3>
          <p className="text-sm text-muted-foreground text-center">
            Generate a meal plan to automatically create a shopping list.
          </p>
        </CardContent>
      </Card>
    )
  }

  const groupedItems = shoppingList.shopping_list_items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, ShoppingListItem[]>,
  )

  const categories = Object.keys(groupedItems).sort()

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handleToggleItem = async (itemId: string, currentChecked: boolean) => {
    if (!onToggleItem) return

    setLoadingItems((prev) => ({ ...prev, [itemId]: true }))
    try {
      await onToggleItem(itemId, !currentChecked)
    } finally {
      setLoadingItems((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const totalItems = shoppingList.shopping_list_items.length
  const checkedItems = shoppingList.shopping_list_items.filter((item) => item.checked).length
  const progress = Math.round((checkedItems / totalItems) * 100)

  const exportList = () => {
    let text = `${"═".repeat(60)}\n`
    text += `FITTRACK SHOPPING LIST\n`
    text += `${"═".repeat(60)}\n\n`
    text += `${shoppingList.name}\n`
    text += `Generated: ${new Date(shoppingList.created_at).toLocaleDateString()}\n`
    text += `Items: ${totalItems} | Purchased: ${checkedItems} | Progress: ${progress}%\n`
    text += `${"═".repeat(60)}\n\n`

    categories.forEach((category) => {
      text += `${category.toUpperCase()}\n${"-".repeat(50)}\n`
      groupedItems[category].forEach((item) => {
        const checkmark = item.checked ? "✓" : "○"
        const quantityStr =
          item.quantity > 0 && item.quantity !== 1
            ? `${item.quantity} ${item.measure}`
            : item.measure !== "unit"
              ? `${item.measure}`
              : ""
        text += `${checkmark} ${quantityStr ? quantityStr + " - " : ""}${item.food}\n`
      })
      text += "\n"
    })

    text += `${"═".repeat(60)}\n`
    text += `Downloaded from FitTrack • ${new Date().toLocaleDateString()}\n`

    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `FitTrack_Shopping_List_${new Date().toISOString().split("T")[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/shopping-list/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: shoppingList.name,
          created_at: shoppingList.created_at,
          items: shoppingList.shopping_list_items.map((item) => ({
            id: item.id,
            food: item.food,
            quantity: item.quantity,
            measure: item.measure,
            category: item.category,
            checked: item.checked,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `FitTrack_Shopping_List_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const { toast } = await import("sonner")
      toast.success("Shopping list downloaded successfully!")
    } catch (error) {
      console.error("[v0] PDF export error:", error)
      const { toast } = await import("sonner")
      toast.error(`Failed to download shopping list: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              {shoppingList.name}
            </CardTitle>
            <CardDescription>
              {checkedItems} of {totalItems} items ({progress}% complete)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={exportPDF}
              disabled={isExporting}
              title="Download as PDF"
              className="bg-primary hover:bg-primary/90"
            >
              {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              Download List
            </Button>
            {onDeleteList && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeleteList(shoppingList.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {categories.map((category) => {
              const categoryItems = groupedItems[category]
              const categoryChecked = categoryItems.filter((i) => i.checked).length
              const isExpanded = expandedCategories[category] !== false

              return (
                <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between h-auto py-2 px-3 hover:bg-primary/5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-primary">{category}</span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryChecked}/{categoryItems.length}
                        </Badge>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors ${
                          item.checked ? "opacity-60 bg-muted/30" : ""
                        }`}
                      >
                        {loadingItems[item.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={() => handleToggleItem(item.id, item.checked)}
                          />
                        )}
                        <span className={`flex-1 text-sm ${item.checked ? "line-through" : ""}`}>
                          {item.quantity > 0 && item.quantity !== 1 && (
                            <span className="font-medium">
                              {item.quantity} {item.measure}{" "}
                            </span>
                          )}
                          {item.food}
                        </span>
                        {item.checked && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
