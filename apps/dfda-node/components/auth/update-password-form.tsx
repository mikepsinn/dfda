"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updatePassword } from "@/app/(auth)/update-password/actions" // Action to be created next

export default function UpdatePasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorMessage = searchParams.get('error');
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
  }, [searchParams]);

  // Clear error when user starts typing
  const handleInput = () => {
    if (error) {
      setError(null);
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    // Call the server action directly
    // Redirects will be handled by the action
    await updatePassword(formData);
    // If the action doesn't redirect (e.g., unexpected client error), stop loading
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a New Password</CardTitle>
        <CardDescription>
          Enter and confirm your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Use onSubmit for client-side handling before calling action */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password" // Name attribute is crucial for FormData
              type="password"
              required
              minLength={8} // Add basic client-side length check
              placeholder="Enter your new password"
              onInput={handleInput}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="Confirm your new password"
              onInput={handleInput}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
      {/* Optional Footer */}
      <CardFooter>
        {/* Add links if needed, e.g., back to login if user gives up */}
      </CardFooter>
    </Card>
  )
} 