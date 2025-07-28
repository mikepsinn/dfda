"use client"

import { ArrowRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="w-full bg-gradient-to-b from-white to-gray-50 py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Discover How Food Affects Your Health
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              FDAi helps you quantify exactly how specific foods and treatments are helping or hurting your health
              conditions. Start chatting with our AI assistant below to begin your health journey.
            </p>
          </div>
          <div className="space-x-4">
            <Button
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              onClick={() => {
                document.querySelector(".health-chatbot")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Start Now
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
