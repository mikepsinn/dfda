"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SubmissionComplete() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Complete</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Thank you for your submission!</p>
        <Button asChild>
          <a href="/patient/dashboard">Return to Dashboard</a>
        </Button>
      </CardContent>
    </Card>
  )
}
