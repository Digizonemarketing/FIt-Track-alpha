import Link from "next/link"
import { Utensils } from "lucide-react"

export function OnboardingHeader() {
  return (
    <header className="bg-background border-b sticky top-0 z-10 backdrop-blur-sm bg-background/95">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center gap-2">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">FitTrack</span>
        </Link>
      </div>
    </header>
  )
}
