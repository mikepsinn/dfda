import {getConditionByNameWithTreatmentRatings} from "@/app/dfdaActions";
import { DFDABreadcrumbs } from "@/components/Breadcrumbs/DFDABreadcrumbs";
import Link from 'next/link';

export default async function ConditionPage({ params }: { params: { conditionName: string } }) {
    // Decode the conditionName from the URL
    const decodedConditionName = decodeURIComponent(params.conditionName);
    
    const condition = await getConditionByNameWithTreatmentRatings(decodedConditionName)

    if (!condition) {
        return <div>Condition not found</div>
    }

    return (
        <div className="container mx-auto p-4">
            <DFDABreadcrumbs dynamicValues={{ 
                conditionName: condition.name,
            }} />
            <h1 className="text-2xl font-bold mb-4">{condition.name}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Treatment Reviews Box */}
                <Link href={`/conditions/${condition.name}/treatment-reviews`} 
                   className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">📊</span>
                        <h2 className="text-xl font-semibold">Treatment Reviews</h2>
                    </div>
                    <p className="text-gray-600">See aggregated treatment reviews for {condition.name}</p>
                </Link>

                {/* Mega-Study Box - Keep as <a> since it's external */}
                <a href={`https://studies.dfda.earth/variables/${condition.name}`}
                   className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
                   target="_blank"
                   rel="noopener noreferrer">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">🔬</span>
                        <h2 className="text-xl font-semibold">{condition.name} Mega-Study</h2>
                    </div>
                    <p className="text-gray-600">See a mega-study on the effects of foods and drugs based on real-world data</p>
                </a>

                {/* Meta-Analysis Box */}
                <Link href={`/conditions/${condition.name}/meta-analysis`}
                   className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">📚</span>
                        <h2 className="text-xl font-semibold">Meta-Analysis</h2>
                    </div>
                    <p className="text-gray-600">See a meta-analysis aggregating all available research on treatments</p>
                </Link>

                {/* Join Trials Box */}
                <Link href={`/trials/search?queryCond=${encodeURIComponent(condition.name)}`}
                   className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">🔍</span>
                        <h2 className="text-xl font-semibold">Join Trials</h2>
                    </div>
                    <p className="text-gray-600">See open trials for {condition.name}</p>
                </Link>
            </div>
        </div>
    )
}