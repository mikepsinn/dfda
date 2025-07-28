import Link from "next/link"
import { ArrowLeft, Beaker } from "lucide-react"
import type { Metadata } from 'next';
import { getMetadataFromNavKey } from '@/lib/metadata';

import { Button } from "@/components/ui/button"
import ForgotPasswordForm from "@/components/auth/forgot-password-form"

// Generate metadata using the helper function
export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey('forgot_password');
}

export default function ForgotPassword() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Beaker className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">FDA.gov v2</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="sm">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-md">
            <div className="mb-8 flex items-center gap-2">
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to login</span>
              </Link>
              <h1 className="text-2xl font-bold">Reset Password</h1>
            </div>

            <ForgotPasswordForm />

          </div>
        </div>
      </main>
    </div>
  )
}

