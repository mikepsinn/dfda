import { Metadata } from "next"
import Link from "next/link"
import { siteConfig } from "@/config/site"
import { UserAuthForm } from "@/components/user/user-auth-form"

export const metadata: Metadata = {
  title: `Enter ${siteConfig.name}`,
  description: siteConfig.description,
}

export default function Signin() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-black tracking-tight">
            Welcome to {siteConfig.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Please verify your identity to enter the magical kingdom!
          </p>
        </div> */}
        <UserAuthForm />
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/signup"
            className="hover:text-brand underline underline-offset-4"
          >
            Not a member yet?
          </Link>
        </p>
      </div>
    </div>
  )
}
