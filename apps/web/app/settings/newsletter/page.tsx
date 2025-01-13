"use server"

import { Metadata } from "next"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"
import { LoginPromptButton } from "@/components/LoginPromptButton"
import { prisma } from "@/lib/db"

export const metadata: Metadata = {
  title: "Newsletter Settings",
  description: "Manage your newsletter subscription preferences",
}

async function toggleNewsletter(subscribed: boolean) {
  "use server"
  
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false

  await prisma.user.update({
    where: { id: session.user.id },
    data: { 
      newsletterSubscribed: subscribed,
      newsletterEmails: subscribed,
      // If subscribing, ensure unsubscribeFromAll is false
      unsubscribeFromAll: subscribed ? false : undefined
    },
  })

  return true
}

export default async function NewsletterPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return (
      <div className="neobrutalist-container">
        <div className="neobrutalist-gradient-container neobrutalist-gradient-pink mb-8">
          <h3 className="neobrutalist-title text-white mb-2">Newsletter Subscription</h3>
          <p className="neobrutalist-description text-white/80">
            Sign in to manage your newsletter preferences
          </p>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-lg">Please sign in to subscribe to our newsletter</p>
          <LoginPromptButton 
            buttonText="Sign in to Subscribe" 
            buttonVariant="neobrutalist"
          />
        </div>
      </div>
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      newsletterSubscribed: true,
      newsletterEmails: true,
      unsubscribeFromAll: true
    }
  })

  const isSubscribed = user?.newsletterSubscribed && user?.newsletterEmails && !user?.unsubscribeFromAll

  return (
    <div className="neobrutalist-container">
      <div className="neobrutalist-gradient-container neobrutalist-gradient-pink mb-8">
        <h3 className="neobrutalist-title text-white mb-2">Newsletter Settings</h3>
        <p className="neobrutalist-description text-white/80">
          Manage your newsletter subscription
        </p>
      </div>
      <form action={toggleNewsletter.bind(null, !isSubscribed)} className="space-y-4">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            id="newsletter"
            checked={isSubscribed}
            className="h-4 w-4"
            onChange={() => {}} // Controlled component
          />
          <label htmlFor="newsletter" className="text-lg">
            Subscribe to our newsletter
          </label>
        </div>
        <button type="submit" className="neobrutalist-button">
          {isSubscribed ? "Unsubscribe" : "Subscribe"}
        </button>
      </form>
    </div>
  )
} 