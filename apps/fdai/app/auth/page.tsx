"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthProvider } from "@/contexts/auth-context"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading authentication...</p>
        </div>
      }
    >
      <AuthProvider initialSession={null}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">FDAi Health Insights</h1>
            <p className="text-muted-foreground mt-2">Discover how your diet and lifestyle affect your health</p>
          </div>
          <AuthForm />
        </div>
      </AuthProvider>
    </Suspense>
  )
}
