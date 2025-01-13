import { DFDABreadcrumbs } from "@/components/Breadcrumbs/DFDABreadcrumbs";


export default async function TreatmentTreatmentRatingsPage({ params }: { params: { treatmentName: string } }) {
    // Decode the treatmentName from the URL
    const decodedTreatmentName = decodeURIComponent(params.treatmentName);

    return (
        <div className="container mx-auto p-4">
        <DFDABreadcrumbs dynamicValues={{ 
            treatmentName: treatment.name,
        }} />
            <h1 className="text-2xl font-bold mb-4">{decodedTreatmentName}</h1>
            <div className="h-[calc(100vh-12rem)] w-full bg-white">
                <iframe
                src={`https://studies.dfda.earth/variables/${decodedTreatmentName}`}
                className="h-full w-full border-0"
                title={decodedTreatmentName || "Variable Details"}
                />
            </div>
        </div>
    )
}