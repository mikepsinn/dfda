import { TreatmentContent } from './components/TreatmentContent'
import { getTreatmentMetaAnalysis } from '@/app/dfdaActions'
import { notFound } from 'next/navigation'

export default async function TreatmentPage({ params }: { params: { treatmentName: string } }) {
  const treatmentName = decodeURIComponent(params.treatmentName)
  
  try {
    // Validate the treatment exists before rendering the content
    await getTreatmentMetaAnalysis(treatmentName)
    
    return (
      <div className="container mx-auto px-4 py-8">
        <TreatmentContent treatmentName={treatmentName} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}