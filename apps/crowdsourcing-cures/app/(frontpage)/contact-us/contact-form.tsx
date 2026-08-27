"use client"

import { useRef, useState, type FormEvent } from "react"
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { submitContactForm, type ContactFormResponse } from "./actions"

const fieldClassName =
  "w-full rounded-lg border-4 border-black bg-white px-4 py-3 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder:text-black/45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6633FF]/50 disabled:cursor-not-allowed disabled:opacity-60"

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<ContactFormResponse>({})
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    setState({})

    try {
      const response = await submitContactForm(
        new FormData(event.currentTarget)
      )
      setState(response)

      if (response.success) {
        formRef.current?.reset()
      }
    } catch {
      setState({
        error:
          "We couldn't send your message. Please try again or email support@dfda.earth directly.",
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="neobrutalist-container space-y-6">
      <div>
        <h2 className="neobrutalist-h2">Send a message</h2>
        <p className="neobrutalist-p">
          All fields are required. We&apos;ll send a confirmation to your email
          address.
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isPending} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="firstName" className="block font-black uppercase">
                First name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                required
                maxLength={100}
                className={fieldClassName}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="block font-black uppercase">
                Last name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                required
                maxLength={100}
                className={fieldClassName}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block font-black uppercase">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              required
              maxLength={255}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="block font-black uppercase">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              required
              maxLength={200}
              className={fieldClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="block font-black uppercase">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={7}
              required
              minLength={10}
              maxLength={5000}
              className={cn(fieldClassName, "min-h-44 resize-y")}
            />
          </div>

          <Button
            type="submit"
            variant="neobrutalist"
            disabled={isPending}
            className="h-auto w-full bg-[#00FF88] py-3 text-base font-black uppercase"
          >
            {isPending ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send aria-hidden="true" />
                Send message
              </>
            )}
          </Button>
        </fieldset>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {state.success && state.message ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border-4 border-black bg-[#00FF88] p-4 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" />
            <p>{state.message}</p>
          </div>
        ) : null}

        {state.error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border-4 border-black bg-[#FF6B6B] p-4 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" />
            <p>{state.error}</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
