"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { TableStats } from "@/components/admin/table-stats"
import { SchemaView } from "@/components/admin/schema-view"
import { AdminActions } from "@/components/admin/admin-actions"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push("/auth")
        return
      }

      try {
        // This is a simplified check - in a real app, you'd have a more robust admin check
        const { data, error } = await supabase.rpc("is_admin", { user_id: user.id })

        // For demo purposes, we'll just check if the email contains "admin"
        const isAdminUser = user.email?.includes("admin") || false

        setIsAdmin(isAdminUser)
        setIsLoading(false)

        if (!isAdminUser) {
          setError("You don't have permission to access this page")
        }
      } catch (err) {
        console.error("Error checking admin status:", err)
        setError("Failed to verify admin status")
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, router])

  if (isLoading && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Checking admin status...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to access the admin area. Admin access is restricted to users with admin
              privileges.
            </AlertDescription>
          </Alert>

          {process.env.NODE_ENV === "development" && (
            <div className="p-4 border rounded-md bg-yellow-50 dark:bg-yellow-900/20">
              <h3 className="font-medium mb-2">Development Mode</h3>
              <p className="text-sm mb-3">
                In development mode, you can use the admin login button at the bottom left of the screen, or create an
                admin user with an email containing "admin".
              </p>
              <p className="text-sm text-muted-foreground">Current user: {user?.email || "Not logged in"}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">FDAi Admin Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schema">Database Schema</TabsTrigger>
          <TabsTrigger value="actions">Admin Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TableStats isLoading={isLoading} setIsLoading={setIsLoading} setError={setError} />
        </TabsContent>

        <TabsContent value="schema">
          <SchemaView />
        </TabsContent>

        <TabsContent value="actions">
          <AdminActions
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            error={error}
            setError={setError}
            success={success}
            setSuccess={setSuccess}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
