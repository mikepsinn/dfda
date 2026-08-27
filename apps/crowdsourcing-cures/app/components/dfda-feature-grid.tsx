"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Robot } from "@phosphor-icons/react"
import { Activity, Info, Pill, Scroll, Users } from "lucide-react"

import { FeatureBox } from "./FeatureBox"

export default function DFDAFeatureGrid() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const features = useMemo(
    () => [
      {
        title: "The Disease Eradication Initiative",
        desc: "Help us give people suffering access to the most promising treatments",
        color: "bg-blue-400",
        icon: Scroll,
        media: "/img/right-to-trial-act.webp",
        onClick: () => {
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
        onClick: () =>
          window.open("https://fdai.earth", "_blank", "noopener,noreferrer"),
      },
      {
        title: "Your Digital Twin Safe",
        desc: "Securely store and control your health data",
        color: "bg-purple-400",
        icon: Pill,
        media:
          "https://user-images.githubusercontent.com/2808553/180306571-ac9cc741-6f34-4059-a814-6f8a72ed8322.png",
        onClick: () => {
          setIsLoading(true)
          router.push("/safe/redirect/intro")
        },
      },
      {
        title: "Clinipedia",
        desc: "The Wikipedia of Clinical Research",
        color: "bg-red-400",
        icon: Users,
        media:
          "https://static.crowdsourcingcures.org/dfda/clinipedia-inflammatory-pain-small.gif",
        onClick: () =>
          window.open(
            "https://studies.dfda.earth",
            "_blank",
            "noopener,noreferrer"
          ),
      },
      {
        title: "Outcome Labels",
        desc: "See how treatments affect specific health outcomes",
        color: "bg-orange-400",
        icon: Activity,
        media: "https://wiki.dfda.earth/assets/outcome-labels.PNG",
        onClick: () =>
          window.open(
            "https://studies.dfda.earth",
            "_blank",
            "noopener,noreferrer"
          ),
      },
      {
        title: "Why Decentralize the FDA?",
        desc: "Learn about the historical context and need for decentralization",
        color: "bg-yellow-400",
        icon: Info,
        media:
          "https://thinkbynumbers.org/wp-content/uploads/2021/03/news-story-headline-1-1024x563.png",
        onClick: () =>
          window.open(
            "https://why.dfda.earth",
            "_blank",
            "noopener,noreferrer"
          ),
      },
    ],
    [router]
  )

  return (
    <>
      {isLoading && (
        <div className="neobrutalist-loading">
          <div className="neobrutalist-loading-spinner" />
        </div>
      )}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureBox key={feature.title} {...feature} index={index} />
        ))}
      </section>
    </>
  )
}
