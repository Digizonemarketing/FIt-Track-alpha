"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const supabaseClient = createClient()

    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (isMounted) {
          setUser(session?.user || null)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("[v0] Auth error:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to check auth status")
          setIsLoading(false)
        }
      }
    }

    checkUser()

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        setUser(session?.user || null)
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setError(null)
      const supabaseClient = createClient()
      const { data, error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })

      if (signUpError) throw signUpError
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign up"
      setError(errorMessage)
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const supabaseClient = createClient()
      const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in"
      setError(errorMessage)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const supabaseClient = createClient()
      const { error: signOutError } = await supabaseClient.auth.signOut()
      if (signOutError) throw signOutError
      setUser(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign out"
      setError(errorMessage)
      throw err
    }
  }

  const logout = signOut

  const resetPassword = async (email: string) => {
    try {
      setError(null)
      const supabaseClient = createClient()
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset email"
      setError(errorMessage)
      throw err
    }
  }

  return {
    user,
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
    logout,
    resetPassword,
  }
}
