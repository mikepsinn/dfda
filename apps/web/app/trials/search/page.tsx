import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ListStudiesRequest } from "../../lib/clinical-trials-gov"
import TrialSearchAndResults from "../components/TrialSearchAndResults"

interface SearchPageProps {
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

export default function SearchResultsPage({
  searchParams,
}: SearchPageProps) {
  return (
    <div className="">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/trials"
            className="group mb-4 inline-flex items-center gap-2 rounded-xl border-4 border-black bg-white px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <ArrowLeft className="transition-transform group-hover:-translate-x-1" />
            Back to Search
          </Link>

          <TrialSearchAndResults searchParams={searchParams} />
        </div>
      </div>
    </div>
  )
}