"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { Session, User, AuthError } from "@supabase/supabase-js"

type AuthContextType = {
  session: Session | null
  user: User | null
  isLoading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; user: User | null }>
  signInWithEmail: (email: string) => Promise<{ error: AuthError | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null; user: User | null }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode
  initialSession?: Session | null
}) {
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [isLoading, setIsLoading] = useState(!initialSession)

  // Create the Supabase browser client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    // Check for existing session if not provided
    if (!initialSession) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("Initial session check:", session ? "Session exists" : "No session")
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session ? "Session exists" : "No session")

      // Add enhanced logging for development
      if (process.env.NODE_ENV === "development") {
        console.group(`🔒 Auth Event: ${_event}`)
        console.log(
          "Session:",
          session
            ? {
                user: {
                  id: session.user.id,
                  email: session.user.email,
                  emailVerified: session.user.email_confirmed_at ? true : false,
                  metadata: session.user.user_metadata,
                },
                expiresAt: session.expires_at,
                refreshToken: session.refresh_token ? "Present" : "None",
              }
            : "None",
        )
        console.groupEnd()
      }

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialSession, supabase.auth])

  // Enhance the signUp method with better logging
  const signUp = async (email: string, password: string) => {
    console.log("Attempting to sign up with email:", email)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (process.env.NODE_ENV === "development") {
        console.group("🔒 Sign Up Result")
        if (error) {
          console.error("Error:", error.message, error)
        } else {
          console.log("Success:", {
            user: data.user
              ? {
                  id: data.user.id,
                  email: data.user.email,
                  emailConfirmed: data.user.email_confirmed_at ? true : false,
                }
              : null,
            session: data.session ? "Present" : "None",
          })
        }
        console.groupEnd()
      }

      if (!error && data.user) {
        setUser(data.user)
        setSession(data.session)
      }

      setIsLoading(false)
      return { error, user: data?.user || null }
    } catch (e) {
      console.error("Unexpected error during sign up:", e)
      setIsLoading(false)
      return {
        error: {
          message: e instanceof Error ? e.message : "Unknown error during sign up",
          status: 500,
        } as AuthError,
        user: null,
      }
    }
  }

  const signInWithEmail = async (email: string) => {
    console.log("Attempting to sign in with email:", email)
    setIsLoading(true)
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    console.log("Sign in with email result:", error ? `Error: ${error.message}` : "Success", data)
    setIsLoading(false)
    return { error }
  }

  // Enhance the signInWithPassword method with better logging
  const signInWithPassword = async (email: string, password: string) => {
    console.log("Attempting to sign in with password for:", email)
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (process.env.NODE_ENV === "development") {
        console.group("🔒 Sign In Result")
        if (error) {
          console.error("Error:", error.message, error)
        } else {
          console.log("Success:", {
            user: data.user
              ? {
                  id: data.user.id,
                  email: data.user.email,
                  emailConfirmed: data.user.email_confirmed_at ? true : false,
                }
              : null,
            session: data.session ? "Present" : "None",
          })
        }
        console.groupEnd()
      }

      if (!error && data.user) {
        setUser(data.user)
        setSession(data.session)
      }

      setIsLoading(false)
      return { error, user: data?.user || null }
    } catch (e) {
      console.error("Unexpected error during password sign-in:", e)
      setIsLoading(false)
      return {
        error: {
          message: e instanceof Error ? e.message : "Unknown error during sign in",
          status: 500,
        } as AuthError,
        user: null,
      }
    }
  }

  const signInWithGoogle = async () => {
    console.log("Attempting to sign in with Google")
    setIsLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    console.log("Signing out")
    setIsLoading(true)
    await supabase.auth.signOut()
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signUp,
        signInWithEmail,
        signInWithPassword,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
