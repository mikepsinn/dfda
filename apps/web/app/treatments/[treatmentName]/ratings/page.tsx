import { DFDABreadcrumbs } from '@/components/Breadcrumbs/DFDABreadcrumbs'
import { notFound } from 'next/navigation'
import { getTreatmentWithConditionRatings } from './actions'
import { TreatmentConditionRatingsList } from './components/TreatmentConditionRatingsList'

export default async function TreatmentRatingsPage({ params }: { params: { treatmentName: string } }) {
  const treatmentName = decodeURIComponent(params.treatmentName)
  
  try {
    const treatment = await getTreatmentWithConditionRatings(treatmentName)

    if (!treatment) {
      notFound()
    }

    return (
      <div className="container mx-auto p-4">
        <DFDABreadcrumbs dynamicValues={{ 
          treatmentName: treatment.name
        }} />
        
        <h1 className="text-2xl font-bold mb-6">Condition Reviews for {treatment.name}</h1>
        
        <TreatmentConditionRatingsList treatment={treatment} />
      </div>
    )
  } catch (error) {
    notFound()
  }
} 