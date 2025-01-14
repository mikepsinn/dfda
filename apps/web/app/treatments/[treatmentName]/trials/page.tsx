import { ListStudiesRequest } from "@/app/lib/clinical-trials-gov"
import TrialSearchAndResults from "@/app/trials/components/TrialSearchAndResults"

interface TreatmentTrialsPageProps {
  params: {
    treatmentName: string
  }
  searchParams: Partial<ListStudiesRequest> & {
    sex?: string
    ageRange?: string
    phase?: string[]
    studyType?: string[]
    zipCode?: string
    distance?: string
    status?: string[]
    dateRanges?: string
  }
}

export default function TreatmentTrialsPage({
  params,
  searchParams,
}: TreatmentTrialsPageProps) {
  const decodedTreatmentName = decodeURIComponent(params.treatmentName);
  
  return (
    <div className="mx-auto max-w-6xl">
      <TrialSearchAndResults 
        searchParams={searchParams}
        defaultIntervention={decodedTreatmentName}
      />
    </div>
  )
}
