import { type NextRequest, NextResponse } from "next/server"
import { jsPDF } from "jspdf"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { todayMeals, nutrition, weight } = await request.json()

    // Create PDF document
    const pdf = new jsPDF()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const pageWidth = pdf.internal.pageSize.getWidth()
    let yPosition = 20

    // Header
    pdf.setFontSize(20)
    pdf.text("FitTrack Daily Report", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 10

    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: "center" })
    yPosition += 15

    // Reset color
    pdf.setTextColor(0, 0, 0)

    // Nutrition Summary Section
    pdf.setFontSize(14)
    pdf.text("Nutrition Summary", 20, yPosition)
    yPosition += 10

    pdf.setFontSize(10)
    const nutritionData = [
      [`Daily Calories: ${Math.round(nutrition.calories)} kcal`],
      [`Protein: ${Math.round(nutrition.protein)}g`],
      [`Carbs: ${Math.round(nutrition.carbs)}g`],
      [`Fat: ${Math.round(nutrition.fat)}g`],
    ]

    nutritionData.forEach((item) => {
      pdf.text(item[0], 25, yPosition)
      yPosition += 7
    })

    yPosition += 5

    // Today's Meals Section
    if (todayMeals && todayMeals.length > 0) {
      pdf.setFontSize(14)
      pdf.text("Today's Meals", 20, yPosition)
      yPosition += 10

      pdf.setFontSize(9)
      todayMeals.slice(0, 5).forEach((meal: any) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(`• ${meal.meal_type}: ${meal.food_name} (${Math.round(meal.calories)} kcal)`, 25, yPosition)
        yPosition += 6
      })

      yPosition += 5
    }

    // Weight Info Section
    if (weight) {
      pdf.setFontSize(14)
      pdf.text("Weight Tracking", 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.text(`Current Weight: ${weight} kg`, 25, yPosition)
      yPosition += 7
    }

    // Generate PDF
    const pdfBuffer = pdf.output("arraybuffer")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="fittrack-report-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
