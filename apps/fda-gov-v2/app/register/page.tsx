"use client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { RegisterForm } from "./register-form"

export default function Register() {
  return (
    <main className="flex-1 py-6 md:py-10">
      <div className="container">
        <div className="mx-auto max-w-md">
          <div className="mb-8 flex items-center gap-2">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
            <h1 className="text-2xl font-bold">Create an Account</h1>
          </div>

          <RegisterForm />
        </div>
      </div>
    </main>
  )
}

