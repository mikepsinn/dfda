'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Shown when the profile cannot be read or saved. The role form is not shown
// then, because the user may already have a role that the app could not read.
export default function SelectRoleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex items-center justify-center bg-muted/40 p-4 md:p-8">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-2xl">Could not load your profile</CardTitle>
          <CardDescription className="text-center">
            Your account is safe. Please try again in a moment.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button className="w-full" onClick={() => reset()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
