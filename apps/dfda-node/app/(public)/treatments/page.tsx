import { InternalLink } from "@/components/internal-link";
// import Link from "next/link"; // Removed standard Link import
import { getTreatmentsAction } from "@/lib/actions/treatments";
import type { Treatment } from "@/lib/actions/treatments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/logger";

export default async function TreatmentsPage() {
  let treatments: Treatment[] = [];
  try {
    treatments = await getTreatmentsAction();
  } catch (error) {
    logger.error('Error fetching treatments for index page:', { error });
    // Optionally render an error message to the user
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Treatments</h1>
      <Separator className="mb-6" />

      {treatments.length === 0 ? (
        <p>No treatments found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treatments.map((treatment) => (
            <Card key={treatment.id}>
              <CardHeader>
                <CardTitle>
                  {/* <Link href={`/treatments/${treatment.id}`} className="hover:underline"> */}
                  <InternalLink
                    navKey="public_treatments_detail" // Make sure this navKey exists in generated-nav-tree.ts
                    params={{ globalVariableId: treatment.id }}
                    className="hover:underline"
                  >
                    {treatment.name}
                  </InternalLink>
                  {/* </Link> */} 
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {treatment.description || "No description available."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
