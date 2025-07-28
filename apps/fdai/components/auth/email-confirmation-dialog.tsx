"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mail, RefreshCw } from "lucide-react"

interface EmailConfirmationDialogProps {
  open: boolean
  onClose: () => void
  email: string
  onResendEmail: () => void
  isResending: boolean
}

export function EmailConfirmationDialog({
  open,
  onClose,
  email,
  onResendEmail,
  isResending,
}: EmailConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            Email Confirmation Required
          </DialogTitle>
          <DialogDescription>
            Your account has been created but requires email verification before you can sign in.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">We've sent a confirmation email to:</p>
            <p className="font-bold text-blue-900 dark:text-blue-200 break-all">{email}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm">Please check your inbox and click the confirmation link to activate your account.</p>
            <p className="text-sm text-muted-foreground">
              If you don't see the email, check your spam folder or request a new confirmation link.
            </p>
          </div>
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onResendEmail} disabled={isResending} className="gap-2">
            {isResending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isResending ? "Sending..." : "Resend Confirmation Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
