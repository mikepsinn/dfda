import { ConditionsList } from "./conditions-list";
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from "react";
import type { Metadata } from 'next';
import { getMetadataFromNavKey } from '@/lib/metadata';
import { medicalSnapshot } from '@/lib/demo/treatment-estimates';

// Generate metadata using the helper function
export async function generateMetadata(): Promise<Metadata> {
  return getMetadataFromNavKey('conditions');
}

export default function ConditionsPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-2">Find Trials by Condition</h1>
      <p className="text-muted-foreground mb-6">
        Select a condition below to view available clinical trials.
      </p>
      <div className="mb-6 rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Compare treatments before exploring trials</h2>
        <p className="mt-2 text-sm text-muted-foreground">Compare current treatment estimates for {medicalSnapshot.counts.conditions} conditions.</p>
        <Button asChild className="mt-4 gap-2"><Link href="/treatment-rankings">Explore treatment rankings <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></Button>
      </div>
      {/* Use Suspense for better loading UX while data fetches */}
      <Suspense fallback={<ConditionsList.Skeleton />}>
        <ConditionsList />
      </Suspense>
    </div>
  );
}
