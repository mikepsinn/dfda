'use client'

import { DfdaCondition, DfdaConditionTreatment } from "@prisma/client"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

type MiniTreatmentListProps = {
    condition: DfdaCondition & {
        conditionTreatments: (DfdaConditionTreatment & {
            treatment: { name: string }
        })[]
    }
}

function calculateEffectivenessScore(treatment: {
    majorImprovement: number
    moderateImprovement: number
    noEffect: number
    worse: number
    muchWorse: number
}): number {
    const weights = {
        majorImprovement: 2,
        moderateImprovement: 1,
        noEffect: 0,
        worse: -1,
        muchWorse: -2
    }

    const totalResponses =
        treatment.majorImprovement +
        treatment.moderateImprovement +
        treatment.noEffect +
        treatment.worse +
        treatment.muchWorse

    if (totalResponses === 0) return 0

    const weightedSum =
        weights.majorImprovement * treatment.majorImprovement +
        weights.moderateImprovement * treatment.moderateImprovement +
        weights.noEffect * treatment.noEffect +
        weights.worse * treatment.worse +
        weights.muchWorse * treatment.muchWorse

    return ((weightedSum / totalResponses) + 2) * 25
}

function getConfidenceLevel(popularity: number): { text: string; color: string } {
    if (popularity > 50) return { text: 'HIGH', color: 'bg-[#00CC66]' }
    if (popularity > 25) return { text: 'MEDIUM', color: 'bg-[#FFB800]' }
    return { text: 'LOW', color: 'bg-[#FF3366]' }
}

function toTitleCase(str: string): string {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        }
    )
}

export default function MiniTreatmentList({ condition }: MiniTreatmentListProps) {
   
    // Sort by effectiveness by default
    const treatments = [...condition.conditionTreatments].sort(
        (a, b) => calculateEffectivenessScore(b) - calculateEffectivenessScore(a)
    ).slice(0, 3) // Only show top 3 treatments

    return (
        <div className="space-y-2">
            {treatments.map((treatment) => {
                const effectivenessScore = calculateEffectivenessScore(treatment)
                const confidenceWidth = (treatment.popularity / Math.max(...treatments.map(t => t.popularity))) * 100
                const confidence = getConfidenceLevel(treatment.popularity)
                
                return (
                    <div
                        key={treatment.id}
                        className="neobrutalist-gradient-container !p-3"
                    >
                        <div className="flex flex-col">
                            <h3 className="font-black text-sm mb-2">{toTitleCase(treatment.treatment.name)}</h3>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <span className="text-xs font-bold mr-2">Effectiveness</span>
                                    <div className="flex-grow h-2 bg-white rounded-xl border-2 border-black">
                                        <div
                                            className="h-full rounded-xl bg-[#FF3366]"
                                            style={{ width: `${effectivenessScore}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-black ml-2">{Math.round(effectivenessScore)}%</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-xs font-bold mr-2">
                                        Confidence
                                    </span>
                                    <div className="flex-grow h-2 bg-white rounded-xl border-2 border-black">
                                        <div
                                            className={`h-full rounded-xl ${confidence.color}`}
                                            style={{ width: `${confidenceWidth}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-black ml-2">
                                        {confidence.text}
                                    </span>
                                </div>
                                <Link 
                                    href={`/treatments/${encodeURIComponent(treatment.treatment.name)}`}
                                    className="neobrutalist-button !py-1 text-xs font-bold hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                >
                                    Join Trial
                                </Link>
                            </div>
                        </div>
                    </div>
                )
            })}
            <Link 
                href={`/conditions/${encodeURIComponent(condition.name)}`}
                className="neobrutalist-button w-full !py-2 flex items-center justify-center gap-2 text-sm font-bold hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
                See All Treatments
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    )
} 