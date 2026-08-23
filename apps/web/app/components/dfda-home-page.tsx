"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Robot } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { Activity, Info, Pill, Scroll, Users, X } from "lucide-react"

import { GlobalVariable } from "@/types/models/all"
import VariableSearchAutocomplete from "@/app/components/VariableSearchAutocomplete"
import { NewsletterSection } from "@/components/landingPage/NewsletterSection"
import { getEmbeddableVariableUrl } from "@/lib/dfda/variable-page-url"

import AdvancedTrialSearch from "../trials/components/AdvancedTrialSearch"
import CitizenScienceSection from "./CitizenScienceSection"
import DFDAComparisonTable from "./DFDAComparisonTable"
import DFDACostSavingsTable from "./DFDACostSavingsTable"
// import { DFDADisclaimer } from "./DFDADisclaimer"
import { FeatureBox } from "./FeatureBox"
import SolutionSection from "./SolutionSection"
// import DeathTollTimer from "./DeathTollTimer"
import ProblemsWithCurrentSystem from "../docs/disease-eradication-act/components/problems-with-the-current-system"
import HowItWorksSection from "./HowItWorksSection"
import ProblemStatisticsGrid from "./ProblemStatisticsGrid"
import BenefitStatisticsGrid from "./BenefitStatisticsGrid"

export default function DFDAHomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVariableUrl, setSelectedVariableUrl] = useState<string | null>(
    null
  )
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const handleDigitalTwinSafeClick = useCallback(async (path: string) => {
    setIsLoading(true)
    // send to /safe/redirect/[path]
    router.push(`/safe/redirect/${path}`)
  }, [router])

  const features = useMemo(() => [
    {
      title: "The Disease Eradication Initiative",
      desc: "Help us give people suffering access to the most promising treatments",
      color: "bg-blue-400",
      icon: Scroll,
      media: "https://wiki.dfda.earth/right_to_trial_act_image.jpg",
      onClick: async () => {
        console.log("Disease Eradication Initiative clicked")
        setIsLoading(true)
        router.push("/dfda/docs/disease-eradication-act")
      },
    },
    {
      title: "Your Personal FDAi Agent",
      desc: "Help us give everyone a free superintelligent doctor",
      color: "bg-green-400",
      icon: Robot,
      media:
        "https://player.vimeo.com/video/930843979?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
      onClick: () => {
        console.log("FDAi Agent clicked")
        // Add specific behavior here, e.g., open a modal with AI tool demo
        window.open("https://fdai.earth", "_blank")
      },
    },
    {
      title: "Your Digital Twin Safe",
      desc: "Securely store and control your health data",
      color: "bg-purple-400",
      icon: Pill,
      media:
        "https://user-images.githubusercontent.com/2808553/180306571-ac9cc741-6f34-4059-a814-6f8a72ed8322.png",
      onClick: () => {
        handleDigitalTwinSafeClick("intro")
      },
    },
    {
      title: "Clinipedia",
      desc: "The Wikipedia of Clinical Research",
      color: "bg-red-400",
      icon: Users,
      media:
        "https://static.crowdsourcingcures.org/dfda/clinipedia-inflammatory-pain-small.gif",
      onClick: () => {
        console.log("Clinipedia clicked")
        // open studies.dfda.earth in a new tab
        window.open("https://studies.dfda.earth", "_blank")
      },
    },
    {
      title: "Outcome Labels",
      desc: "See how treatments affect specific health outcomes",
      color: "bg-orange-400",
      icon: Activity,
      media: "https://wiki.dfda.earth/assets/outcome-labels.PNG",
      onClick: () => {
        console.log("Outcome Labels clicked")
        // open studies.dfda.earth in a new tab
        window.open("https://studies.dfda.earth", "_blank")
      },
    },
    {
      title: "Why Decentralize the FDA?",
      desc: "Learn about the historical context and need for decentralization",
      color: "bg-yellow-400",
      icon: Info,
      media:
        "https://thinkbynumbers.org/wp-content/uploads/2021/03/news-story-headline-1-1024x563.png",
      href: "https://why.dfda.earth",
      onClick: () => {
        // open https://dfda.earth in a new tab
        window.open("https://why.dfda.earth", "_blank")
        console.log("Why dFDA clicked")
      },
    },
  ], [handleDigitalTwinSafeClick, router])

  const closeVariableStudy = useCallback(() => {
    setSelectedVariableUrl(null)
  }, [])

  const onVariableSelect = useCallback((variable: GlobalVariable) => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement) {
      const searchInput = activeElement
        .closest("[data-variable-search-autocomplete]")
        ?.querySelector<HTMLInputElement>('input[type="search"]')
      returnFocusRef.current = searchInput ?? activeElement
    }

    setSelectedVariableUrl(getEmbeddableVariableUrl(variable))
  }, [])

  useEffect(() => {
    if (!selectedVariableUrl) return

    const previousOverflow = document.body.style.overflow
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeVariableStudy()
    }
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), iframe, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([data-focus-sentinel])'
        )
      )

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialogRef.current.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (
        event.shiftKey &&
        (activeElement === firstElement ||
          !dialogRef.current.contains(activeElement))
      ) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement ||
          !dialogRef.current.contains(activeElement))
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleEscape)
    document.addEventListener("keydown", handleTab)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("keydown", handleTab)
      returnFocusRef.current?.focus()
      returnFocusRef.current = null
    }
  }, [closeVariableStudy, selectedVariableUrl])

  return (
    <div className="">
      {isLoading && (
        <div className="neobrutalist-loading">
          <div className="neobrutalist-loading-spinner"></div>
        </div>
      )}
      {selectedVariableUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Variable mega-study"
          className="fixed inset-0 z-50 bg-black/75 p-4"
          onClick={closeVariableStudy}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative h-full w-full"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close variable mega-study"
              className="absolute right-0 top-0 z-10 rounded-full bg-white p-4 text-black hover:bg-gray-100"
              onClick={closeVariableStudy}
            >
              <X aria-hidden="true" size={32} />
            </button>
            <iframe
              src={selectedVariableUrl}
              className="h-full w-full rounded-xl bg-white"
              title="Variable mega-study"
            />
            <span
              data-focus-sentinel
              tabIndex={0}
              className="sr-only"
              onFocus={() => closeButtonRef.current?.focus()}
            />
          </div>
        </div>
      )}
      <header className="neobrutalist-container mb-12">
        <motion.h1
          className="neobrutalist-hero-title"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          We Can Eradicate Disease
        </motion.h1>
        <motion.p
          className="neobrutalist-description"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          🚀 by giving all patients the right to effortlessly participate in global decentralized clinical research 💊
        </motion.p>
      </header>

      {/* <DeathTollTimer /> */}

      <main className="space-y-12">
        {/* <DFDADisclaimer /> */}
        <section className="neobrutalist-gradient-container neobrutalist-gradient-green mb-12 ">
          <h2 className="neobrutalist-title mb-6">Problems We Can Solve</h2>
          <p className="neobrutalist-description mb-6">
            To have any hope of eradicating disease, we first need to solve the following problems:
          </p>
          <ProblemStatisticsGrid />
        </section>
        <section className="neobrutalist-gradient-container neobrutalist-gradient-pink mb-12">
          <h2 className="neobrutalist-title mb-6">The World We Can Create 🌍</h2>
          <p className="neobrutalist-description mb-6">
            If we gave every patient the right to effortlessly participate in decentralized clinical trials, we could achieve:
          </p>
          <BenefitStatisticsGrid />
          
        </section>
        <HowItWorksSection />
        <DFDAComparisonTable />
        <section className="mt-12">
          <DFDACostSavingsTable />
        </section>

        <ProblemsWithCurrentSystem />
        <section className="neobrutalist-gradient-container neobrutalist-gradient-pink">
          <h2 className="neobrutalist-title">See Effects of Foods🍟</h2>
          <div className="flex flex-col gap-4 md:flex-row">
            <VariableSearchAutocomplete
              onVariableSelect={onVariableSelect}
              searchParams={{
                sort: "-numberOfCorrelationsAsCause",
                isPublic: "1",
                variableCategoryName: "Foods",
                limit: "10",
              }}
              placeholder="Enter Foods🍟"
            />
          </div>
        </section>

        <section className="neobrutalist-gradient-container neobrutalist-gradient-pink">
          <h2 className="neobrutalist-title">See Effects of Treatments💊</h2>
          <div className="flex flex-col gap-4 md:flex-row">
            <VariableSearchAutocomplete
              onVariableSelect={onVariableSelect}
              searchParams={{
                sort: "-numberOfCorrelationsAsCause",
                isPublic: "1",
                variableCategoryName: "Treatments",
                limit: "10",
              }}
              placeholder="Enter treatment 💊"
            />
          </div>
        </section>

        <section className="neobrutalist-gradient-container neobrutalist-gradient-pink">
          <h2 className="neobrutalist-title">
            See Most Effective Treatments for your Condition
          </h2>
          <div className="flex flex-col gap-4 md:flex-row">
            <VariableSearchAutocomplete
              onVariableSelect={onVariableSelect}
              searchParams={{
                sort: "-numberOfCorrelationsAsCause",
                isPublic: "1",
                variableCategoryName: "Symptoms",
                limit: "10",
              }}
              placeholder="Enter symptom 🤒"
            />
          </div>
        </section>

        <section className="neobrutalist-gradient-container neobrutalist-gradient-green">
          <h2 className="neobrutalist-title">Join Clinical Trials 🔬</h2>
          <p className="neobrutalist-description mb-6">
            Find and instantly join trials for the most promising treatments
          </p>
          <AdvancedTrialSearch />
        </section>

{/*         <section className="neobrutalist-gradient-container neobrutalist-gradient-pink">
          <h2 className="neobrutalist-title">
            🏢 Drug Companies: Create Your Trial 📝
          </h2>
          <div className="flex flex-col gap-4">
            <p className="neobrutalist-description">
              See how easy it could be to instantly register your treatment and
              create a study 📝, automate recruitment 🤖, data collection 📊,
              analysis 🔬, and get your drug to patients ASAP!
            </p>
            <Link
              href="/drug-companies/register-drug"
              className="neobrutalist-button group"
            >
              Register Now
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section> */}


        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureBox key={feature.title} {...feature} index={index} />
          ))}
        </section>

        {/* <ProblemSection />
        <GoodNewsSection /> */}
        <SolutionSection />
        <CitizenScienceSection />
        <NewsletterSection />
      </main>
    </div>
  )
}
