import { Metadata } from "next"
import Link from "next/link"
import { UserAuthForm } from "@/components/user/user-auth-form"

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create an account",
}

export default function Signup() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-2">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-black tracking-tight">
            Sign Up!
          </h1>
        </div>
        <UserAuthForm />
        <p className="text-center text-sm text-muted-foreground">
          Already a citizen?{" "}
          <Link
            href="/signin"
            className="hover:text-brand underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
