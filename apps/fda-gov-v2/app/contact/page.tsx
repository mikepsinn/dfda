import type { Metadata } from "next"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contact Us | Decentralized FDA",
  description: "Get in touch with our team for questions, support, or partnership opportunities.",
}

export default function ContactPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Contact Us</h1>
      <p className="text-center text-lg text-muted-foreground mb-10">
        We&apos;re here to help. Fill out the form below, and we&apos;ll get back to you as soon as possible.
      </p>
      <ContactForm />
    </div>
  )
}
