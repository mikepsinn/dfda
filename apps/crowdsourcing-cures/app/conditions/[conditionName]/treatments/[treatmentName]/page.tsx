import { getTreatmentConditionMetaAnalysis } from '@/app/dfdaActions'
import { notFound } from 'next/navigation'
import { ConditionTreatmentContent } from './components/ConditionTreatmentContent'

export default async function ConditionTreatmentPage({ 
  params 
}: { 
  params: { conditionName: string; treatmentName: string } 
}) {
  const conditionName = decodeURIComponent(params.conditionName)
  const treatmentName = decodeURIComponent(params.treatmentName)

  try {
    // Validate the treatment and condition combination exists
    await getTreatmentConditionMetaAnalysis(treatmentName, conditionName)
    
    return (
      <div className="container mx-auto px-4 py-8">
        <ConditionTreatmentContent 
          treatmentName={treatmentName} 
          conditionName={conditionName} 
        />
      </div>
    )
  } catch (error) {
    notFound()
  }
}