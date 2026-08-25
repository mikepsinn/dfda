import { getConditionByNameWithTreatmentRatings } from "@/app/dfdaActions"
import { DFDABreadcrumbs } from "@/components/Breadcrumbs/DFDABreadcrumbs"
import Link from "next/link"

const STUDIES_URL = "https://studies.dfda.earth"

export default async function ConditionPage({
  params,
}: {
  params: { conditionName: string }
}) {
  // Decode the conditionName from the URL
  const decodedConditionName = decodeURIComponent(params.conditionName)

  const condition =
    await getConditionByNameWithTreatmentRatings(decodedConditionName)

  if (!condition) {
    return <div>Condition not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <DFDABreadcrumbs
        dynamicValues={{
          conditionName: condition.name,
        }}
      />
      <h1 className="mb-4 text-2xl font-bold">{condition.name}</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Treatment Reviews Box */}
        <Link
          href={`/conditions/${condition.name}/treatment-reviews`}
          className="rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <h2 className="text-xl font-semibold">Treatment Reviews</h2>
          </div>
          <p className="text-gray-600">
            See aggregated treatment reviews for {condition.name}
          </p>
        </Link>

        {/* Condition-specific study routes are unavailable, so use the research hub for now. */}
        <a
          href={STUDIES_URL}
          className="rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl">🔬</span>
            <h2 className="text-xl font-semibold">{condition.name} Studies</h2>
          </div>
          <p className="text-gray-600">
            Browse observational studies and real-world evidence on
            studies.dfda.earth
          </p>
        </a>

        {/* Condition-specific meta-analyses are unavailable, so use the research hub for now. */}
        <a
          href={STUDIES_URL}
          className="rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <h2 className="text-xl font-semibold">Studies &amp; Analyses</h2>
          </div>
          <p className="text-gray-600">
            Explore available studies and analyses on studies.dfda.earth
          </p>
        </a>

        {/* Join Trials Box */}
        <Link
          href={`/trials/search?queryCond=${encodeURIComponent(condition.name)}`}
          className="rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <h2 className="text-xl font-semibold">Join Trials</h2>
          </div>
          <p className="text-gray-600">See open trials for {condition.name}</p>
        </Link>
      </div>
    </div>
  )
}
