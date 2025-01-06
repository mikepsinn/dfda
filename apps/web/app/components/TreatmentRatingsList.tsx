'use client'

import { useState } from 'react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import Link from 'next/link'
import { DfdaCondition, DfdaConditionTreatment } from "@prisma/client";
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

type TreatmentListProps = {
    condition: DfdaCondition & {
        conditionTreatments: (DfdaConditionTreatment & {
            treatment: { name: string }
        })[]
    }
};

function calculateEffectivenessScore(treatment: {
    majorImprovement: number;
    moderateImprovement: number;
    noEffect: number;
    worse: number;
    muchWorse: number;
}): number {
    const weights = {
        majorImprovement: 2,
        moderateImprovement: 1,
        noEffect: 0,
        worse: -1,
        muchWorse: -2
    };

    const totalResponses =
        treatment.majorImprovement +
        treatment.moderateImprovement +
        treatment.noEffect +
        treatment.worse +
        treatment.muchWorse;

    if (totalResponses === 0) return 0;

    const weightedSum =
        weights.majorImprovement * treatment.majorImprovement +
        weights.moderateImprovement * treatment.moderateImprovement +
        weights.noEffect * treatment.noEffect +
        weights.worse * treatment.worse +
        weights.muchWorse * treatment.muchWorse;

    // Normalize to a 0-100 scale
    return ((weightedSum / totalResponses) + 2) * 25;
}

function toTitleCase(str: string): string {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

export default function TreatmentRatingsList({ condition }: TreatmentListProps) {
    const [treatments, setTreatments] = useState(condition.conditionTreatments)
    const [sortBy, setSortBy] = useState<'effectiveness' | 'popularity'>('effectiveness')
    const [searchQuery, setSearchQuery] = useState('')

    const handleSort = (type: 'effectiveness' | 'popularity') => {
        setSortBy(type)
        const filtered = condition.conditionTreatments.filter(treatment => 
            treatment.treatment.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        const sorted = [...filtered].sort((a, b) =>
            type === 'popularity'
                ? b.popularity - a.popularity
                : calculateEffectivenessScore(b) - calculateEffectivenessScore(a)
        )
        setTreatments(sorted)
    }

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        const filtered = condition.conditionTreatments.filter(treatment => 
            treatment.treatment.name.toLowerCase().includes(query.toLowerCase())
        )
        const sorted = [...filtered].sort((a, b) =>
            sortBy === 'popularity'
                ? b.popularity - a.popularity
                : calculateEffectivenessScore(b) - calculateEffectivenessScore(a)
        )
        setTreatments(sorted)
    }

    const getConfidence = (popularity: number) => {
        if (popularity > 50) return { level: 'HIGH', color: 'bg-[#00CC66]' };
        if (popularity > 25) return { level: 'MEDIUM', color: 'bg-[#FFB800]' };
        return { level: 'LOW', color: 'bg-[#FF3366]' };
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Search className="h-4 w-4" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Filter treatments..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="neobrutalist-gradient-container pl-9 pr-9 border-4 border-black bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => handleSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-black/5 rounded-full p-0.5"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Clear search</span>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <Select onValueChange={(value) => handleSort(value as 'effectiveness' | 'popularity')} defaultValue="effectiveness">
                        <SelectTrigger className="neobrutalist-button w-full">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="effectiveness">SORT BY HIGHEST AVERAGE RATING</SelectItem>
                            <SelectItem value="popularity">SORT BY MOST TRIED</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                {treatments.map((treatment) => {
                    const effectivenessScore = calculateEffectivenessScore(treatment);
                    const confidence = getConfidence(treatment.popularity);
                    const maxRatings = Math.max(...treatments.map(t => t.popularity));
                    const confidenceWidth = (treatment.popularity / maxRatings) * 100;
                    
                    return (
                        <Link
                            href={`/conditions/${encodeURIComponent(condition.name)}/treatments/${encodeURIComponent(treatment.treatment.name)}`}
                            key={treatment.id}
                            className="block hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                        >
                            <div className="neobrutalist-gradient-container">
                                <div className="flex flex-col">
                                    <h3 className="font-black text-lg mb-3">{toTitleCase(treatment.treatment.name)}</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <span className="text-xs sm:text-sm font-bold mr-2 sm:mr-3">Effectiveness</span>
                                            <div className="flex-grow h-3 sm:h-4 bg-white rounded-xl border-2 border-black">
                                                <div
                                                    className="h-full rounded-xl bg-[#FF3366]"
                                                    style={{ width: `${effectivenessScore}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs sm:text-sm font-black ml-2 sm:ml-3">{Math.round(effectivenessScore)}%</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                                                Confidence
                                            </span>
                                            <div className="flex-grow h-3 sm:h-4 bg-white rounded-xl border-2 border-black">
                                                <div
                                                    className={`h-full rounded-xl ${confidence.color}`}
                                                    style={{ width: `${confidenceWidth}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs sm:text-sm font-black ml-2 sm:ml-3">
                                                {treatment.popularity} ratings
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}