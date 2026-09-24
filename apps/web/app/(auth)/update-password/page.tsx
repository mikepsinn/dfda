import Link from "next/link"
import { Beaker } from "lucide-react"
import type { Metadata } from 'next';
import { env } from '@/lib/env';

import UpdatePasswordForm from "../../../components/auth/update-password-form"

export const metadata: Metadata = {
  title: `Update Password | ${env.NEXT_PUBLIC_SITE_NAME}`,
  description: `Update your ${env.NEXT_PUBLIC_SITE_NAME} account password.`,
  // Add other relevant metadata fields if needed
};

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Basic Header - Consider using Layout component if applicable */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Beaker className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">{env.NEXT_PUBLIC_SITE_NAME}</span>
            </Link>
          </div>
          {/* Hide auth buttons on update page? Or show logged-in state? Depends on flow */}
        </div>
      </header>
      <main className="flex-1 py-6 md:py-10">
        <div className="container">
          <div className="mx-auto max-w-md">
            <div className="mb-8 flex items-center gap-2">
              {/* No back arrow needed as user arrives via email link */}
              <h1 className="text-2xl font-bold">Update Your Password</h1>
            </div>

            <UpdatePasswordForm />

          </div>
        </div>
      </main>
    </div>
  )
}
