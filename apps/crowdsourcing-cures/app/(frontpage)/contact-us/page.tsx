import { Metadata } from "next"
import { Mail } from "lucide-react"

import { Shell } from "@/components/layout/shell"

import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contact Us | Decentralized FDA",
  description:
    "Get in touch with us for any questions or inquiries about Decentralized FDA.",
}

export default function ContactPage() {
  return (
    <Shell>
      <div className="container mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-6 md:py-8">
        <section className="neobrutalist-gradient-container neobrutalist-gradient-pink">
          <h1 className="neobrutalist-title text-white">Contact Us</h1>
          <p className="neobrutalist-description max-w-3xl text-white/90">
            Have a question, idea, or problem? Send us a message and we&apos;ll
            get back to you as soon as possible.
          </p>
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          <ContactForm />

          <aside className="neobrutalist-container space-y-5 bg-[#FFE66D]">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Mail aria-hidden="true" className="h-7 w-7" />
            </div>
            <div>
              <h2 className="neobrutalist-h2">Prefer email?</h2>
              <p className="neobrutalist-p">
                You can reach the support team directly at:
              </p>
            </div>
            <a
              href="mailto:support@dfda.earth"
              className="neobrutalist-link break-all"
            >
              support@dfda.earth
            </a>
            <p className="text-sm font-bold">
              Please don&apos;t include private medical information in your
              message.
            </p>
          </aside>
        </div>
      </div>
    </Shell>
  )
}
