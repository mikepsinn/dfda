import type { Metadata } from "next"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contact Us | Decentralized FDA",
  description: "Get in touch with our team for questions, support, or partnership opportunities.",
}

export default function ContactPage() {
  return (
    <div className="container max-w-6xl py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground mb-6">
            Have questions about the Decentralized FDA platform? We're here to help. Fill out the form and our team will
            get back to you as soon as possible.
          </p>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">General Inquiries</h2>
              <p className="text-muted-foreground">
                For general questions about our platform, services, or how to get started.
              </p>
              <p className="mt-2">
                <a href="mailto:info@dfda.org" className="text-primary hover:underline">
                  info@dfda.org
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Technical Support</h2>
              <p className="text-muted-foreground">Need help with the platform or experiencing technical issues?</p>
              <p className="mt-2">
                <a href="mailto:support@dfda.org" className="text-primary hover:underline">
                  support@dfda.org
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Partnership Opportunities</h2>
              <p className="text-muted-foreground">
                Interested in partnering with us or exploring collaboration opportunities?
              </p>
              <p className="mt-2">
                <a href="mailto:partnerships@dfda.org" className="text-primary hover:underline">
                  partnerships@dfda.org
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Media Inquiries</h2>
              <p className="text-muted-foreground">For press and media-related questions.</p>
              <p className="mt-2">
                <a href="mailto:media@dfda.org" className="text-primary hover:underline">
                  media@dfda.org
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-2xl font-bold mb-4">Send Us a Message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}

