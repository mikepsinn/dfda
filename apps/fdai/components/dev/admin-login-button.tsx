"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AdminLoginButton() {
  const { signInWithPassword } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState("")
  const [dialogTitle, setDialogTitle] = useState("")
  const [dialogType, setDialogType] = useState<"info" | "error" | "warning">("info")

  const createAdminAccount = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/admin/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to create admin account",
          needsServiceKey: data.needsServiceKey || false,
        }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Error creating admin account:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        needsServiceKey: false,
      }
    }
  }

  const handleAdminLogin = async () => {
    setIsLoading(true)
    try {
      // Admin credentials
      const adminEmail = "fdai-admin@dfda.earth"
      const adminPassword = "admin123"

      console.log(`Attempting to sign in with admin account: ${adminEmail}`)

      // Try to sign in first
      const { error } = await signInWithPassword(adminEmail, adminPassword)

      if (error) {
        console.log(`Admin login failed: ${error.message}`)

        // If login fails, try to create the account
        console.log("Attempting to create admin account...")
        const result = await createAdminAccount(adminEmail, adminPassword)

        if (!result.success) {
          if (result.needsServiceKey) {
            setDialogTitle("Service Role Key Required")
            setDialogMessage(
              "To create an admin account automatically, you need to add a Supabase Service Role Key to your environment variables.\n\n" +
                "1. Go to your Supabase project dashboard\n" +
                "2. Navigate to Project Settings > API\n" +
                "3. Copy the 'service_role key' (NOT the anon key)\n" +
                "4. Add it to your .env.local file as SUPABASE_SERVICE_ROLE_KEY\n\n" +
                "⚠️ Warning: Keep this key secure and never expose it to the client side!",
            )
            setDialogType("warning")
          } else {
            setDialogTitle("Admin Account Creation Failed")
            setDialogMessage(`Failed to create admin account: ${result.error}`)
            setDialogType("error")
          }
          setShowDialog(true)
        } else {
          // Show success message
          setDialogTitle("Admin Account Created")
          setDialogMessage(
            "The admin account has been created and confirmed. You can now log in with the admin credentials.",
          )
          setDialogType("info")
          setShowDialog(true)
        }
      } else {
        // Successful login
        console.log("Admin login successful")
        router.push("/admin")
      }
    } catch (err) {
      console.error("Unexpected error during admin login:", err)
      setDialogTitle("Error")
      setDialogMessage("An unexpected error occurred. See console for details.")
      setDialogType("error")
      setShowDialog(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Only render in development mode
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAdminLogin}
        disabled={isLoading}
        className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800"
      >
        <Shield className="mr-2 h-4 w-4" />
        {isLoading ? "Processing..." : "Admin Login (Dev)"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogType === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="whitespace-pre-line">{dialogMessage}</DialogDescription>
          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
