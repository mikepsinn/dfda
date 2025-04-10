"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Mail, LogIn, Shield, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { EmailConfirmationDialog } from "./email-confirmation-dialog"
import { LoginForm } from "./login-form"
import { SignupForm } from "./signup-form"
import { DemoLoginButton } from "./demo-login-button"
import { SocialLoginButtons } from "./social-login-buttons"
import { EmailSentView } from "./email-sent-view"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function AuthForm() {
  // Default to signup mode
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup")
  const [email, setEmail] = useState("")
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<"general" | "email_not_confirmed" | "user_exists" | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState("")
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [isAdminLoading, setIsAdminLoading] = useState(false)
  const [authContextAvailable, setAuthContextAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize auth context and its loading state
  const [auth, setAuth] = useState<ReturnType<typeof useAuth> | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    try {
      const authContext = useAuth()
      setAuth(authContext)
      setAuthContextAvailable(true)
    } catch (e) {
      console.error("Auth context not available:", e)
      setAuthContextAvailable(false)
    } finally {
      setAuthLoading(false)
    }
  }, [])

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== "undefined") {
      // Short timeout to allow auth context to initialize
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  // If auth context is not available, show a loading state
  if (!authContextAvailable && isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>FDAi Health Insights</CardTitle>
          <CardDescription>Loading authentication...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Initializing authentication...</p>
        </CardContent>
      </Card>
    )
  }

  // If auth context is not available after loading, show an error
  if (!authContextAvailable && !isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>Unable to initialize authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              <p>The authentication system could not be initialized. Please try refreshing the page.</p>
              <Button className="mt-4" onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Now we know auth is available
  const { signInWithEmail, signInWithPassword, isLoading: authIsLoading } = auth!

  const handleResendConfirmation = async () => {
    if (!confirmationEmail) return

    setIsResendingEmail(true)
    try {
      await signInWithEmail(confirmationEmail)
      setDebugInfo((prev) => `${prev}\nResent confirmation email to ${confirmationEmail}`)
    } catch (error) {
      console.error("Error resending confirmation:", error)
    } finally {
      setIsResendingEmail(false)
    }
  }

  const handleError = (
    errorMessage: string,
    type: "general" | "email_not_confirmed" | "user_exists" | null = "general",
  ) => {
    setError(errorMessage)
    setErrorType(type)
  }

  const handleLoginSuccess = () => {
    // Router navigation is handled in the LoginForm component
  }

  const handleSignupSuccess = (userEmail: string) => {
    setEmail(userEmail)
    setIsEmailSent(true)
  }

  const handleForgotPassword = () => {
    if (email) {
      signInWithEmail(email)
      setIsEmailSent(true)
    } else {
      setError("Please enter your email address")
      setErrorType("general")
    }
  }

  const handleAdminLogin = async () => {
    setIsAdminLoading(true)
    try {
      // Admin credentials
      const adminEmail = "fdai-admin@dfda.earth"
      const adminPassword = "admin123"

      console.log(`Attempting to sign in with admin account: ${adminEmail}`)

      // Try to sign in
      const { error, user } = await signInWithPassword(adminEmail, adminPassword)

      if (error) {
        console.log(`Admin login failed: ${error.message}`)
        setError(`Admin login failed: ${error.message}`)
        setErrorType("general")
      } else {
        // Successful login
        console.log("Admin login successful")
        router.push("/admin")
      }
    } catch (err) {
      console.error("Unexpected error during admin login:", err)
      setError("An unexpected error occurred during admin login")
      setErrorType("general")
    } finally {
      setIsAdminLoading(false)
    }
  }

  // Function to render error message with appropriate actions
  const renderErrorMessage = () => {
    if (!error) return null

    switch (errorType) {
      case "email_not_confirmed":
        return (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Email Not Confirmed</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <button
                  className="px-3 py-1 bg-white text-red-600 border border-red-600 rounded-md text-sm flex items-center"
                  onClick={() => {
                    setConfirmationEmail(email)
                    setShowConfirmationDialog(true)
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Confirmation
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )

      case "user_exists":
        return (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Account Already Exists</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <button
                  className="px-3 py-1 bg-white text-red-600 border border-red-600 rounded-md text-sm flex items-center"
                  onClick={() => setActiveTab("login")}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Switch to Login
                </button>
              </div>
            </AlertDescription>
          </Alert>
        )

      default:
        return (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )
    }
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>FDAi Health Insights</CardTitle>
          <CardDescription>Track your health journey and discover personalized insights</CardDescription>
        </CardHeader>
        <CardContent>
          {isEmailSent ? (
            <EmailSentView email={email} isSignup={activeTab === "signup"} onReset={() => setIsEmailSent(false)} />
          ) : (
            <div className="space-y-4">
              {/* Demo login button - prominent at the top */}
              <DemoLoginButton onError={handleError} />

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as "signup" | "login")
                  setError(null)
                  setErrorType(null)
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  <TabsTrigger value="login">Login</TabsTrigger>
                </TabsList>

                <TabsContent value="signup">
                  <SignupForm
                    onSuccess={handleSignupSuccess}
                    onError={handleError}
                    onSwitchToLogin={() => setActiveTab("login")}
                  />
                </TabsContent>

                <TabsContent value="login">
                  <LoginForm
                    onSuccess={handleLoginSuccess}
                    onError={handleError}
                    onForgotPassword={handleForgotPassword}
                    onSwitchToSignup={() => setActiveTab("signup")}
                  />
                </TabsContent>
              </Tabs>

              {renderErrorMessage()}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <SocialLoginButtons isLoading={authIsLoading} />

              {/* Admin login button - only in development mode */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAdminLogin}
                    disabled={isAdminLoading}
                    className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {isAdminLoading ? "Logging in..." : "Admin Login (Development Only)"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Debug information section - only visible in development */}
          {process.env.NODE_ENV === "development" && debugInfo && (
            <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto max-h-40">
              <div className="font-bold mb-1">Debug Info:</div>
              <pre>{debugInfo}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div>By signing in, you agree to our Terms of Service and Privacy Policy</div>

          {/* Add admin login button in development mode */}
          {process.env.NODE_ENV === "development" && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto flex items-center gap-1 border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
              onClick={() => {
                const adminEmail = "fdai-admin@dfda.earth"
                const adminPassword = "admin123"
                signInWithPassword(adminEmail, adminPassword).then(({ error }) => {
                  if (error) {
                    console.error("Admin login failed:", error)
                    handleError("Admin login failed: " + error.message)
                  } else {
                    console.log("Admin login successful")
                  }
                })
              }}
            >
              <Shield className="h-3 w-3" />
              Admin
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Email Confirmation Dialog */}
      <EmailConfirmationDialog
        open={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        email={confirmationEmail}
        onResendEmail={handleResendConfirmation}
        isResending={isResendingEmail}
      />
    </>
  )
}
