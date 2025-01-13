"use client"

import { motion } from "framer-motion"
import { EmailSignupForm } from "@/components/user/email-signup-form"

export function NewsletterSection() {
  return (
    <section className="neobrutalist-container mb-12">
      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="neobrutalist-title mb-4">Stay Up to Date!</h2>
        <p className="text-gray-600 mb-6">
          Join our newsletter to receive updates on clinical trials, research breakthroughs, and ways to get involved.
        </p>
        <EmailSignupForm 
          buttonText="Subscribe"
          placeholder="Enter your email for updates"
          description="We'll keep you informed about the latest developments in decentralized clinical research."
          callbackUrl="/settings/newsletter"
          className="max-w-md mx-auto"
        />
      </motion.div>
    </section>
  )
} 