"use client"

import type React from "react"
import { useState } from "react"
import { Building2, Check, Database, HeartHandshake, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { IconBadge } from "@/components/present/slide"
import { donateUrl, instituteEmail } from "@/components/institute/InstituteChrome"
import type { Database as DatabaseTypes } from "@/lib/database.types"
import { logger } from "@/lib/logger"
import { createClient } from "@/utils/supabase/client"

type ContactMessage = DatabaseTypes["public"]["Tables"]["contact_messages"]["Insert"]

const protocolUrl = "https://papers.acceleratedmedicine.org/dfda-protocol"
const codeUrl = "https://github.com/mikepsinn/dfda"

const partnerTypes = [
  { value: "donor", label: "Donor or funder" },
  { value: "clinic", label: "Clinic or doctor" },
  { value: "organization", label: "Organization building its own version" },
  { value: "data", label: "Data partner" },
  { value: "other", label: "Something else" },
]

const partners = [
  {
    type: "donor",
    icon: HeartHandshake,
    title: "Donors and funders",
    text: "Your donation pays for public education, pragmatic-trial research and the open software behind the rankings and labels.",
    links: [{ href: donateUrl, label: "Donate" }],
    talk: "Discuss a major gift",
  },
  {
    type: "clinic",
    icon: Stethoscope,
    title: "Clinics and doctors",
    text: "Run a pilot site, serve on an independent review board, or advise us on the protocol.",
    links: [],
    talk: "Talk to us",
  },
  {
    type: "organization",
    icon: Building2,
    title: "Organizations building their own",
    text: "The protocol and code are open source, so you can build your own version and publish results in the same open format.",
    links: [{ href: protocolUrl, label: "Read the protocol" }, { href: codeUrl, label: "See the code" }],
    talk: "Talk to us",
  },
  {
    type: "data",
    icon: Database,
    title: "Data partners",
    text: "Apps, health record systems, registries and wearable makers would share outcome data through an open API, so their users' results count toward the rankings and labels.",
    links: [],
    talk: "Talk to us",
  },
]

// Partner sign-ups go to the same contact_messages table as the contact form (app/(public)/contact).
export function PartnersSection() {
  const [partnerType, setPartnerType] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const typeLabel = partnerTypes.find(type => type.value === partnerType)?.label
    if (!typeLabel) {
      setFormError("Choose how you'd like to help.")
      return
    }
    setIsSubmitting(true)
    setFormError(null)

    const organization = (formData.get("organization") as string).trim()
    const note = (formData.get("message") as string).trim()
    const message: ContactMessage = {
      name: (formData.get("name") as string).trim(),
      email: formData.get("email") as string,
      subject: `Partner: ${typeLabel}`,
      message: [organization && `Organization: ${organization}`, note].filter(Boolean).join("\n\n") || "(No message)",
      status: "new",
    }

    try {
      const { error } = await createClient().from("contact_messages").insert(message)
      if (error) throw error
      setIsSubmitted(true)
      form.reset()
    } catch (error) {
      logger.error("Error submitting the partner form:", error)
      setFormError(`Your message wasn't sent. Please send it again, or email ${instituteEmail}.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="partners" aria-labelledby="partners-heading" className="scroll-mt-16 py-12 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="partners-heading" className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Partner with us</h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
          {partners.map(partner => (
            <div key={partner.type} className="flex flex-col rounded-lg border bg-background p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <IconBadge icon={partner.icon} size={44} />
                <h3 className="text-xl font-bold">{partner.title}</h3>
              </div>
              <p className="mt-3 flex-grow text-muted-foreground">{partner.text}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {partner.links.map(link => (
                  <Button key={link.href} asChild variant="outline" size="sm">
                    <a href={link.href}>{link.label}</a>
                  </Button>
                ))}
                <Button asChild variant="ghost" size="sm" className="text-primary">
                  <a href="#partner-form" onClick={() => setPartnerType(partner.type)}>{partner.talk}</a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div id="partner-form" className="mx-auto mt-12 max-w-2xl scroll-mt-20 rounded-lg border bg-background p-6 shadow-sm md:p-8">
          {isSubmitted ? (
            <div role="status" className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 rounded-full bg-green-100 p-3">
                <Check aria-hidden="true" className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Thank you</h3>
              <p className="mb-6 text-muted-foreground">We&apos;ve received your message and will be in touch.</p>
              <Button variant="outline" onClick={() => setIsSubmitted(false)}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-2xl font-bold">Tell us how you&apos;d like to help</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partner-name">Name</Label>
                  <Input id="partner-name" name="name" autoComplete="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner-email">Email</Label>
                  <Input id="partner-email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner-organization">Organization (optional)</Label>
                  <Input id="partner-organization" name="organization" autoComplete="organization" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner-type">I&apos;m interested as a</Label>
                  <Select value={partnerType} onValueChange={setPartnerType}>
                    <SelectTrigger id="partner-type">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-message">Message (optional)</Label>
                <Textarea id="partner-message" name="message" className="min-h-[120px]" />
              </div>
              {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                We&apos;ll use your details only to reply to you. You can also email{" "}
                <a href={`mailto:${instituteEmail}`} className="text-primary hover:underline">{instituteEmail}</a>.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
