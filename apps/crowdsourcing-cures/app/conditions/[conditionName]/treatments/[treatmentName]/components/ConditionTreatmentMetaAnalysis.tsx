'use client'

import React, { useEffect, useState } from 'react'
import { getTreatmentConditionMetaAnalysis } from '@/app/dfdaActions'
import ArticleRenderer from '@/components/ArticleRenderer'
import { ArticleWithRelations } from '@/lib/agents/researcher/researcher'
import MetaAnalysisProgress from '@/components/MetaAnalysisProgress'

interface ConditionTreatmentMetaAnalysisProps {
    treatmentName: string
    conditionName: string
}

export function ConditionTreatmentMetaAnalysis({ treatmentName, conditionName }: ConditionTreatmentMetaAnalysisProps) {
    const [article, setArticle] = useState<ArticleWithRelations | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isSubscribed = true
        async function fetchMetaAnalysis() {
            setError(null)
            setLoading(true)
            try {
                const metaAnalysis = await getTreatmentConditionMetaAnalysis(treatmentName, conditionName)
                if (isSubscribed) {
                    setArticle(metaAnalysis)
                }
            } catch (error) {
                if (isSubscribed) {
                    setArticle(null)
                    setError(error instanceof Error ? error.message : 'An error occurred')
                    console.error('Error fetching meta-analysis:', error)
                }
            } finally {
                if (isSubscribed) {
                    setLoading(false)
                }
            }
        }

        fetchMetaAnalysis()
        return () => {
            isSubscribed = false
        }
    }, [treatmentName, conditionName])

    if (loading) {
        return <MetaAnalysisProgress 
            isLoading={loading}
            treatmentName={treatmentName}
            conditionName={conditionName}
            onComplete={() => setLoading(false)}
        />
    }

    if (error) {
        return <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">
                {treatmentName} for {conditionName}
            </h1>
            <div className="p-4 border-l-4 border-red-500 bg-red-50">
                <p className="text-red-700">{error}</p>
            </div>
        </div>
    }

    if (!article) {
        return <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">
                {treatmentName} for {conditionName}
            </h1>
            <p>No analysis available for this treatment and condition combination.</p>
        </div>
    }

    return (
        <div className="">
            <ArticleRenderer article={article} />
        </div>
    )
} 