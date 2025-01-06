import {getConditionByName} from "@/app/dfdaActions";
import TreatmentRatingsList from "@/app/components/TreatmentRatingsList";
import { DFDABreadcrumbs } from "@/components/Breadcrumbs/DFDABreadcrumbs";


export default async function ConditionTreatmentRatingsPage({ params }: { params: { conditionName: string } }) {
    // Decode the conditionName from the URL
    const decodedConditionName = decodeURIComponent(params.conditionName);

    const condition = await getConditionByName(decodedConditionName)

    if (!condition) {
        return <div>Condition not found</div>
    }

    return (
        <div className="container mx-auto p-4">
        <DFDABreadcrumbs dynamicValues={{ 
            conditionName: condition.name,
        }} />
            <h1 className="text-2xl font-bold mb-4">{condition.name}</h1>
            <div className="h-[calc(100vh-12rem)] w-full bg-white">
                <iframe
                src={`https://studies.dfda.earth/variables/${decodedConditionName}`}
                className="h-full w-full border-0"
                title={decodedConditionName || "Variable Details"}
                />
            </div>
        </div>
    )
}