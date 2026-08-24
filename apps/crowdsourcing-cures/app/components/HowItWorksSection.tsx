"use client"

import { useState, useEffect } from "react"
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
      desc: "Simply input the condition that's making you miserable.",
      color: "bg-blue-400",
      icon: Search,
      component: searchComponent,
      onClick: () => {},
    },
    {
      title: "2. View Ranked Treatments",
      desc: "See a ranked list of the most save and effective treatments based on the entire universe of clinical and real-world data.",
      color: "bg-indigo-400", 
      icon: ListFilter,
      component: treatmentListComponent,
      onClick: () => {},
    },
    {
      title: "3. Join Clinical Trials from Home",
      desc: "Instantly enroll in decentralized trials for promising treatments that interest you.",
      color: "bg-violet-400",
      icon: TestTubes,
      media: "https://static.crowdsourcingcures.org/video/autonomous-study-search.gif",
      onClick: () => {},
    },
    {
      title: "4. Get Treatment Delivered",
      desc: "Get treatments delivered to your pharmacy or physician and schedule necessary lab tests automatically.",
      color: "bg-purple-400",
      icon: Pill,
      media: "https://static.crowdsourcingcures.org/video/autonomous-cvs.gif",
      onClick: () => {},
    },
    {
      title: "5. Effortlessly Report Outcomes",
      desc: "Report treatment effects easily through your preferred apps, EHR systems, or automated calls.",
      color: "bg-fuchsia-400",
      icon: MessageSquareText,
      media: "https://static.crowdsourcingcures.org/video/reminder-inbox.gif",
      onClick: () => {},
    },
    {
      title: "6. Continuously Improve Rankings",
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
        How it Works: Upgrade FDA.gov 🚀
      </h2>
      <p className="mb-6 text-lg">
        Use a small fraction of the FDA's $7 billion annual budget to upgrade FDA.gov to 
        allow ANY patient ANYWHERE in the world to:
      </p>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
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
      </div>
    </section>
  )
} 