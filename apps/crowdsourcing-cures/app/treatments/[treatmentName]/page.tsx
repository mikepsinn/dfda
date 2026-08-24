import { DFDABreadcrumbs } from '@/components/Breadcrumbs/DFDABreadcrumbs'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function TreatmentPage({ params }: { params: { treatmentName: string } }) {
  const treatmentName = decodeURIComponent(params.treatmentName)
  
  try {
    // Validate the treatment exists before rendering the content

    return (
      <div className="container mx-auto p-4">
        <DFDABreadcrumbs dynamicValues={{ 
          treatmentName
        }} />
        
        <h1 className="text-2xl font-bold mb-4">{treatmentName}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Treatment Reviews Box */}
          <Link href={`/treatments/${treatmentName}/ratings`}
            className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📊</span>
              <h2 className="text-xl font-semibold">Treatment Reviews</h2>
            </div>
            <p className="text-gray-600">See user reviews and ratings for {treatmentName}</p>
          </Link>

          {/* Mega-Study Box */}
          <Link href={`/treatments/${treatmentName}/mega-study`}
            className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔬</span>
              <h2 className="text-xl font-semibold">Mega-Study</h2>
            </div>
            <p className="text-gray-600">See real-world data analysis for {treatmentName}</p>
          </Link>

          {/* Meta-Analysis Box */}
          <Link href={`/treatments/${treatmentName}/meta-analysis`}
            className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📚</span>
              <h2 className="text-xl font-semibold">Meta-Analysis</h2>
            </div>
            <p className="text-gray-600">See a meta-analysis of all available research</p>
          </Link>

          {/* Clinical Trials Box */}
          <Link href={`/treatments/${treatmentName}/trials`}
            className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔍</span>
              <h2 className="text-xl font-semibold">Clinical Trials</h2>
            </div>
            <p className="text-gray-600">See clinical trials related to {treatmentName}</p>
          </Link>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}