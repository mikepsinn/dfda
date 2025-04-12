import { ConditionsList } from "./conditions-list";
import { Suspense } from "react";

export default function ConditionsPage() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-2">Find Trials by Condition</h1>
      <p className="text-muted-foreground mb-6">
        Select a condition below to view available clinical trials.
      </p>
      {/* Use Suspense for better loading UX while data fetches */}
      <Suspense fallback={<ConditionsList.Skeleton />}>
        <ConditionsList />
      </Suspense>
    </div>
  );
}
