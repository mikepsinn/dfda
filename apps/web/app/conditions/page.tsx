import React from 'react'
import Link from 'next/link'
import { fetchConditions } from '../dfdaActions'
import { DFDABreadcrumbs } from '@/components/Breadcrumbs/DFDABreadcrumbs'
import ConditionSearchSection from '../components/ConditionSearchSection'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default async function ConditionListPage() {
    const conditions = await fetchConditions()
    const sortedConditions = conditions.sort((a, b) => b.numberOfTreatments - a.numberOfTreatments)

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <DFDABreadcrumbs />
            <div className="neobrutalist-gradient-container neobrutalist-gradient-pink">
                <h1 className="neobrutalist-title text-white">Conditions</h1>
                <ConditionSearchSection />
            </div>
            
            <div className="flex flex-wrap gap-3">
                {sortedConditions.map((condition) => (
                    <TooltipProvider key={condition.id}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href={`/conditions/${condition.name}`}>
                                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-full hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                                        <span className="font-medium">{condition.name}</span>
                                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-[#FF3366] rounded-full">
                                            {condition.numberOfTreatments}
                                        </span>
                                    </button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>See {condition.numberOfTreatments} Treatment Rankings</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    )
}