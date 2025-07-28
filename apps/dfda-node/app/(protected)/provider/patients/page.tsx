import { Suspense } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ChevronRight } from "lucide-react";
import { getProviderPatientsAction, PatientProfileSummary } from "@/lib/actions/patients";
import { logger } from '@/lib/logger';

async function PatientList() {
  let patients: PatientProfileSummary[] = [];
  let error: string | null = null;

  try {
    patients = await getProviderPatientsAction();
  } catch (err) {
    logger.error("Failed to fetch provider patients on page:", err);
    error = "Could not load patient data. Please try refreshing the page.";
  }

  if (error) {
    return <div className="text-center text-destructive py-8">{error}</div>;
  }

  if (patients.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        You currently have no patients enrolled in trials.
        {/* Optional: Add a link/button to guide the provider? */}
        {/* <Button asChild variant="link" className="mt-4">
          <Link href="/provider/trials">Manage Trials</Link>
        </Button> */}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {patients.map((patient) => (
        <Link
          key={patient.id}
          href={`/provider/patients/${patient.id}`}
          className="block rounded-lg border p-4 bg-card hover:bg-accent hover:cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar>
                <AvatarImage src={patient.avatar_url ?? undefined} alt={`${patient.first_name} ${patient.last_name}`}/>
                <AvatarFallback>
                  {patient.first_name ? patient.first_name[0] : ''}
                  {patient.last_name ? patient.last_name[0] : ''}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {patient.first_name} {patient.last_name}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {patient.email}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function PatientListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function ProviderPatientsPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Patients
          </CardTitle>
          {/* Optional: Add description or actions here */}
          {/* <p className="text-muted-foreground text-sm">
            Patients currently enrolled in trials you manage.
          </p> */}
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PatientListSkeleton />}>
            <PatientList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
