"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Utensils, ArrowLeft, Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
        },
      })

      if (signupError) {
        if (signupError.message.includes("already registered")) {
          setError("This email is already registered. Please log in instead.")
        } else {
          setError(signupError.message)
        }
        setIsLoading(false)
        return
      }

      if (!data.user) throw new Error("Failed to create user")

      setUserEmail(formData.email)
      setVerificationSent(true)
      setIsLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register"
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="mt-3 text-muted-foreground">
              We've sent a verification link to <strong>{userEmail}</strong>
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 text-left space-y-4">
            <h3 className="font-medium">Next steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Open your email inbox</li>
              <li>Click the verification link in the email</li>
              <li>You'll be redirected to complete your profile</li>
            </ol>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Didn't receive the email? Check your spam folder or</p>
            <Button
              variant="outline"
              onClick={() => {
                setVerificationSent(false)
                setFormData({ ...formData, email: userEmail })
              }}
            >
              Try again with a different email
            </Button>
          </div>

          <div className="text-sm">
            Already verified?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex flex-col">
        <div className="p-6 md:p-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md space-y-8">
            <div>
              <div className="md:hidden flex items-center gap-2 mb-8">
                <Utensils className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">FitTrack</span>
              </div>

              <h1 className="text-3xl font-bold">Create your account</h1>
              <p className="mt-3 text-muted-foreground">Join FitTrack today and start your journey to better health.</p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded-lg flex gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input
                      id="first-name"
                      placeholder="John"
                      required
                      className="h-12"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input
                      id="last-name"
                      placeholder="Doe"
                      required
                      className="h-12"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="h-12"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="h-12"
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Password must be at least 6 characters long.</p>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="terms" required />
                  <Label htmlFor="terms" className="text-sm leading-none">
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 bg-transparent">
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="h-12 bg-transparent">
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
                </svg>
                Apple
              </Button>
            </div>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/70">
          <div
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: "url('/healthy-food-pattern.jpg')",
              backgroundSize: "cover",
            }}
          ></div>
        </div>

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-2 text-white">
            <Utensils className="h-8 w-8" />
            <span className="text-2xl font-bold">FitTrack</span>
          </div>

          <div className="flex-1 flex flex-col justify-center text-white">
            <div className="max-w-md space-y-6">
              <h1 className="text-4xl font-bold">Start your health transformation today</h1>
              <p className="text-lg opacity-90">
                Join thousands of users who have achieved their health goals with FitTrack.
              </p>

              <div className="pt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mt-1">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Personalized Meal Plans</h3>
                    <p className="opacity-80">AI-generated meal plans based on your preferences and goals</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mt-1">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Advanced Health Metrics</h3>
                    <p className="opacity-80">Track BMI, BMR, TDEE and other important health indicators</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mt-1">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Expert Nutritionist Support</h3>
                    <p className="opacity-80">Get guidance from certified nutritionists</p>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-full bg-white/20 overflow-hidden">
                      <Image src="/woman-portrait.png" alt="User testimonial" width={100} height={100} />
                    </div>
                    <div>
                      <h4 className="font-medium">Sarah J.</h4>
                      <p className="text-sm opacity-80">Lost 20 lbs in 3 months</p>
                    </div>
                  </div>
                  <p className="italic opacity-90">
                    "FitTrack helped me lose 20 pounds in 3 months. The meal plans are delicious and easy to follow!"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-white/70 text-sm">© {new Date().getFullYear()} FitTrack. All rights reserved.</div>
        </div>
      </div>
    </div>
  )
}
