'use client';

import React, { useEffect, useState } from 'react';
import { ArticleWithRelations } from "@/lib/agents/researcher/researcher"
import ArticleRenderer from '@/components/ArticleRenderer';
import GlobalHealthOptimizationAgent from "@/components/landingPage/global-health-optimization-agent";
import { getTreatmentMetaAnalysis } from '@/app/dfdaActions';
import MetaAnalysisProgress from '@/components/MetaAnalysisProgress';

interface TreatmentMetaAnalysisProps {
    treatmentName: string
}

export function TreatmentMetaAnalysis({ treatmentName }: TreatmentMetaAnalysisProps) {
    const [article, setArticle] = useState<ArticleWithRelations | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isSubscribed = true
        async function fetchMetaAnalysis() {
            try {
                const metaAnalysis = await getTreatmentMetaAnalysis( treatmentName)
                if (isSubscribed) {
                    setArticle(metaAnalysis)
                }
            } catch (error) {
                if (isSubscribed) {
                    setArticle(null)
                    // Consider using a toast notification or error state
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
    }, [treatmentName])

    if (loading) {
        return <MetaAnalysisProgress isLoading={loading} treatmentName={treatmentName} />
    }

    if (!article) {
        return <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">
               {treatmentName} Meta-Analysis
            </h1>
            <p>No analysis available for this treatment and treatment combination.</p>
        </div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">
                {treatmentName} Meta-Analysis
            </h1>
            <ArticleRenderer article={article} />
            <div className="mt-8">
                <GlobalHealthOptimizationAgent />
            </div>
        </div>
    )
}