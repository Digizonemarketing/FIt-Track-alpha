import { type NextRequest, NextResponse } from "next/server"

interface ShoppingListItem {
  id: string
  food: string
  quantity: number
  measure: string
  category: string
  checked: boolean
}

interface ShoppingListData {
  name: string
  created_at: string
  items: ShoppingListItem[]
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ShoppingListData
    const { name, created_at, items } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items to export" }, { status: 400 })
    }

    const { jsPDF } = await import("jspdf")

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let currentY = margin

    const headerHeight = 35
    doc.setFillColor(22, 163, 74) // FitTrack brand green
    doc.rect(0, 0, pageWidth, headerHeight, "F")

    // Logo/Brand name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont(undefined, "bold")
    doc.text("FitTrack", margin, 15)

    // Tagline
    doc.setFontSize(9)
    doc.setFont(undefined, "normal")
    doc.text("Your Personal Nutrition & Fitness Companion", margin, 23)

    currentY = headerHeight + 10

    doc.setTextColor(22, 163, 74)
    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("SHOPPING LIST", margin, currentY)

    currentY += 8
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text(`Plan: ${name}`, margin, currentY)

    currentY += 5
    doc.text(`Generated: ${new Date(created_at).toLocaleDateString()}`, margin, currentY)

    currentY += 5
    doc.text(`Downloaded: ${new Date().toLocaleDateString()}`, margin, currentY)

    const totalItems = items.length
    const checkedItems = items.filter((item) => item.checked).length
    const progress = Math.round((checkedItems / totalItems) * 100)

    currentY += 8
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "bold")
    doc.setFontSize(10)
    doc.text(`Shopping Progress: ${checkedItems}/${totalItems} items (${progress}%)`, margin, currentY)

    currentY += 4
    const barWidth = pageWidth - 2 * margin
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    doc.rect(margin, currentY, barWidth, 4)
    doc.setFillColor(22, 163, 74)
    doc.rect(margin, currentY, (barWidth * progress) / 100, 4, "F")

    currentY += 10

    doc.setDrawColor(180, 180, 180)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 6

    // Group items by category
    const groupedItems = items.reduce(
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

    doc.setFontSize(9)

    categories.forEach((category) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage()
        currentY = margin
      }

      // Category header
      doc.setFontSize(10)
      doc.setFont(undefined, "bold")
      doc.setTextColor(22, 163, 74)
      const itemCount = groupedItems[category].length
      const checkedCount = groupedItems[category].filter((i) => i.checked).length
      doc.text(`${category} (${checkedCount}/${itemCount})`, margin, currentY)

      currentY += 5

      // Items in category
      doc.setFontSize(9)
      doc.setFont(undefined, "normal")
      doc.setTextColor(0, 0, 0)

      groupedItems[category].forEach((item) => {
        if (currentY > pageHeight - 15) {
          doc.addPage()
          currentY = margin
          // Repeat category header on new page
          doc.setFontSize(9)
          doc.setFont(undefined, "bold")
          doc.setTextColor(150, 150, 150)
          doc.text(`${category} (continued)`, margin, currentY)
          currentY += 4
          doc.setFont(undefined, "normal")
          doc.setTextColor(0, 0, 0)
        }

        const checkbox = item.checked ? "☑" : "☐"
        const quantityStr =
          item.quantity > 0 && item.quantity !== 1
            ? `${item.quantity} ${item.measure}`
            : item.measure !== "unit"
              ? item.measure
              : ""
        const itemText = `${checkbox} ${quantityStr ? quantityStr + " - " : ""}${item.food}`.trim()

        if (item.checked) {
          doc.setTextColor(150, 150, 150)
          doc.setFont(undefined, "normal")
        } else {
          doc.setTextColor(0, 0, 0)
          doc.setFont(undefined, "normal")
        }

        doc.text(itemText, margin + 5, currentY)
        currentY += 4.5
      })

      currentY += 2
    })

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.setFont(undefined, "normal")
    const footerText = `FitTrack • Smart Shopping, Better Nutrition • ${new Date().getFullYear()}`
    doc.text(footerText, margin, pageHeight - 8)

    const pageCount = (doc as any).internal.pages.length - 1
    if (pageCount > 1) {
      doc.text(`Page 1 of ${pageCount}`, pageWidth - margin - 20, pageHeight - 8)
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="FitTrack_Shopping_List_${new Date().toISOString().split("T")[0]}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("[v0] PDF generation error:", error)
    return NextResponse.json({ error: "Failed to generate PDF", details: String(error) }, { status: 500 })
  }
}
