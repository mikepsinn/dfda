"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Search,
  ListFilter,
  TestTubes,
  Pill,
  MessageSquareText,
  BarChart3
} from "lucide-react"
import { DfdaCondition, DfdaConditionTreatment } from "@prisma/client"

import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FeatureBox } from "./FeatureBox"
import MiniTreatmentList from "./MiniTreatmentList"
import { getConditionByNameWithTreatmentRatings } from "@/app/dfdaActions"
import RatedConditionSearchAutocomplete from "./RatedConditionSearchAutocomplete"

export default function HowItWorksSection() {
  const DEFAULT_CONDITION = "Rheumatoid Arthritis"
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<string>(DEFAULT_CONDITION)
  const [conditionData, setConditionData] = useState<DfdaCondition & {
    conditionTreatments: (DfdaConditionTreatment & {
      treatment: { name: string }
    })[]
  } | null>(null)

  useEffect(() => {
    async function fetchConditionData() {
      console.log('fetchConditionData running with selectedCondition:', selectedCondition)
      if (selectedCondition) {
        setIsLoading(true)
        try {
          const data = await getConditionByNameWithTreatmentRatings(selectedCondition)
          console.log('Fetched condition data:', data)
          setConditionData(data)
        } catch (error) {
          console.error("Error fetching condition data:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        console.log('Clearing condition data because selectedCondition is empty')
        setConditionData(null)
      }
    }

    fetchConditionData()
  }, [selectedCondition])

  const handleConditionSelect = (condition: string) => {
    console.log('handleConditionSelect called with:', condition)
    setSelectedCondition(condition)
  }

  const searchComponent = (
    <RatedConditionSearchAutocomplete 
      onConditionSelect={handleConditionSelect} 
      defaultValue={DEFAULT_CONDITION} 
    />
  )

  const treatmentListComponent = isLoading ? (
    <div className="flex justify-center py-4">
      <LoadingSpinner />
    </div>
  ) : conditionData ? (
    <MiniTreatmentList condition={conditionData} />
  ) : (
    <div className="text-center text-sm font-bold opacity-50">
      Enter a condition above to see treatment rankings
    </div>
  )

  const features = [
    {
      title: "1. Enter Your Condition",
      desc: "Simply input your medical condition to begin your personalized treatment journey.",
      color: "bg-blue-400",
      icon: Search,
      component: searchComponent,
      onClick: () => {},
    },
    {
      title: "2. View Ranked Treatments",
      desc: "See evidence-based rankings of treatments using comprehensive clinical and real-world data.",
      color: "bg-indigo-400", 
      icon: ListFilter,
      component: treatmentListComponent,
      onClick: () => {},
    },
    {
      title: "3. Join Clinical Trials",
      desc: "Instantly enroll in decentralized trials for promising treatments that interest you.",
      color: "bg-violet-400",
      icon: TestTubes,
      media: "https://static.crowdsourcingcures.org/video/autonomous-study-search.gif",
      onClick: () => {},
    },
    {
      title: "4. Automated Treatment Access",
      desc: "Get treatments delivered to your pharmacy and schedule necessary lab tests automatically.",
      color: "bg-purple-400",
      icon: Pill,
      media: "https://static.crowdsourcingcures.org/video/autonomous-cvs.gif",
      onClick: () => {},
    },
    {
      title: "5. Effortless Reporting",
      desc: "Report treatment effects easily through your preferred apps, EHR systems, or automated calls.",
      color: "bg-fuchsia-400",
      icon: MessageSquareText,
      media: "https://static.crowdsourcingcures.org/video/import.gif",
      onClick: () => {},
    },
    {
      title: "6. Continuous Improvement",
      desc: "Your data helps improve treatment rankings and benefits future patients globally.",
      color: "bg-pink-400",
      icon: BarChart3,
      media: "https://static.crowdsourcingcures.org/video/black-box-model-animation2.gif",
      onClick: () => {},
    },
  ]

  return (
    <section className="relative overflow-visible rounded-xl border-4 border-black bg-gradient-to-r from-blue-400 to-purple-400 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="mb-6 text-4xl font-black uppercase">
        Our Proposal
      </h2>
      <p className="mb-6 text-lg">
        2 billion people are suffering from over 7000 diseases because it currently takes over $2 billion and 17 years
        to get a new treatment to patients. 
        To solve this problem, we propose the upgrade of FDA.gov to allow you to:
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-8 md:grid-cols-3"
      >
        {features.map((feature, index) => (
          <FeatureBox
            key={feature.title}
            title={feature.title}
            desc={feature.desc}
            color={feature.color}
            icon={feature.icon}
            media={feature.media}
            component={feature.component}
            index={index}
            onClick={feature.onClick}
          />
        ))}
      </motion.div>
    </section>
  )
} 