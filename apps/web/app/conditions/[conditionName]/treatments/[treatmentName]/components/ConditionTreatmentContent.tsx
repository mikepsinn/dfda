'use client'

import React, { useEffect, useState } from 'react'
import { getConditionTreatmentMetaAnalysis } from '@/app/dfdaActions'
import ArticleRenderer from '@/components/ArticleRenderer'
import { ArticleWithRelations } from '@/lib/agents/researcher/researcher'
import MetaAnalysisProgress from '@/components/MetaAnalysisProgress'

interface ConditionTreatmentContentProps {
    treatmentName: string
    conditionName: string
}

export function ConditionTreatmentContent({ treatmentName, conditionName }: ConditionTreatmentContentProps) {
    const [article, setArticle] = useState<ArticleWithRelations | null>(null)
    const [isResearching, setIsResearching] = useState(false)
    const MIN_LOADING_TIME = 3000 // 3 seconds in milliseconds

    useEffect(() => {
        let isSubscribed = true
        let loadingTimer: NodeJS.Timeout

        async function fetchMetaAnalysis() {
            setIsResearching(true)
            const startTime = Date.now()

            try {
                const metaAnalysis = await getConditionTreatmentMetaAnalysis(treatmentName, conditionName)
                if (isSubscribed) {
                    // Calculate remaining time to meet minimum loading duration
                    const elapsedTime = Date.now() - startTime
                    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)

                    // Set a timer to ensure minimum loading time
                    loadingTimer = setTimeout(() => {
                        if (isSubscribed) {
                            setArticle(metaAnalysis)
                            setIsResearching(false)
                        }
                    }, remainingTime)
                }
            } catch (error) {
                if (isSubscribed) {
                    setArticle(null)
                    console.error('Error fetching meta-analysis:', error)
                    // Still ensure minimum loading time even on error
                    const elapsedTime = Date.now() - startTime
                    const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime)
                    loadingTimer = setTimeout(() => {
                        if (isSubscribed) {
                            setIsResearching(false)
                        }
                    }, remainingTime)
                }
            }
        }

        fetchMetaAnalysis()

        return () => {
            isSubscribed = false
            if (loadingTimer) {
                clearTimeout(loadingTimer)
            }
        }
    }, [treatmentName, conditionName])

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">
                {treatmentName} for {conditionName}
            </h1>
            
            <MetaAnalysisProgress 
                isLoading={isResearching}
                treatmentName={treatmentName}
                conditionName={conditionName}
                onComplete={() => setIsResearching(false)}
            />

            {!isResearching && !article && (
                <p>No analysis available for this treatment and condition combination.</p>
            )}

            {!isResearching && article && (
                <>
                    <ArticleRenderer article={article} />
                </>
            )}
        </div>
    )
} 