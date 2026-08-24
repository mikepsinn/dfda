import { DFDABreadcrumbs } from '@/components/Breadcrumbs/DFDABreadcrumbs'
import { TreatmentMetaAnalysis } from './components/TreatmentMetaAnalysis'

interface PageProps {
  params: {
    treatmentName: string
  }
}

export default function TreatmentForTreatmentPage({ params }: PageProps) {
  const treatmentName = decodeURIComponent(params.treatmentName)
  
  return (
    <div className="container mx-auto p-4">
      <DFDABreadcrumbs dynamicValues={{ 
        treatmentName
      }} />
      <TreatmentMetaAnalysis treatmentName={treatmentName} />
    </div>
  )
}