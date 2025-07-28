import { Suspense } from 'react';
import { getTreatmentsAction } from "@/lib/actions/treatments";
import type { Treatment } from "@/lib/actions/treatments";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/logger";
import { TreatmentsList } from "@/components/TreatmentsList";
import { TreatmentCardSkeleton } from "@/components/TreatmentCardSkeleton";

// Component to render the skeleton fallback grid
function TreatmentsSkeletonFallback() {
  // Render a few skeletons (e.g., 6)
  const skeletonCount = 6;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <TreatmentCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Define the component that fetches data and renders the list
async function TreatmentsContent() {
  let treatments: Treatment[] = [];
  try {
    treatments = await getTreatmentsAction();
  } catch (error) {
    logger.error('Error fetching treatments for index page:', { error });
    // Handle error state appropriately, maybe return an error component
    return <p className="text-destructive">Failed to load treatments.</p>;
  }
  return <TreatmentsList treatments={treatments} />;
}

export default function TreatmentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Treatments</h1>
      <Separator className="mb-6" />

      {/* Wrap the data-dependent component in Suspense */}
      <Suspense fallback={<TreatmentsSkeletonFallback />}>
        {/* This component will be rendered once its data is ready */}
        <TreatmentsContent />
      </Suspense>
    </div>
  );
}
