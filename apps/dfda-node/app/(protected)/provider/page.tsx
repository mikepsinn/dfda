import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, ListChecks, Users, FileText, Search, ShieldCheck } from "lucide-react";
import { DashboardStats } from "../../(protected)/provider/dashboard/components/dashboard-stats";

const features = [
  {
    name: "Dashboard",
    description: "Get an overview of your activities and statistics.",
    href: "/provider/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Intervention Assignment",
    description: "Manage and assign interventions to patients.",
    href: "/provider/intervention-assignment",
    icon: ListChecks,
  },
  {
    name: "Patients",
    description: "View and manage your patient roster.",
    href: "/provider/patients",
    icon: Users,
  },
  {
    name: "Form Management",
    description: "Create and manage forms for data collection.",
    href: "/provider/form-management",
    icon: FileText,
  },
  {
    name: "Find Trials",
    description: "Search for relevant clinical trials.",
    href: "/provider/find-trials",
    icon: Search,
  },
  {
    name: "EHR Authorization",
    description: "Manage patient EHR authorizations.",
    href: "/provider/ehr-authorization",
    icon: ShieldCheck,
  },
];

export default function ProviderPage() {
  const fakeStats = {
    activeTrials: 5,
    enrolledPatients: 42,
    eligiblePatients: 115,
    pendingActions: 8,
    pendingActionsDueSoon: 3,
    upcomingVisits: 15,
    upcomingVisitsThisWeek: 6,
    upcomingVisitsNextWeek: 9,
  };

  return (
    <div className="relative mt-12 mb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h3 className="text-2xl font-bold text-center mb-8">Provider Overview</h3>

        <div className="mb-12">
          <DashboardStats {...fakeStats} />
        </div>

        <h4 className="text-xl font-semibold text-center mb-8">Manage Your Activities</h4>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.name} className="flex flex-col items-center text-center p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <feature.icon className="h-10 w-10 mb-4 text-primary" />
              <h4 className="text-lg font-semibold mb-2">{feature.name}</h4>
              <p className="text-muted-foreground text-sm mb-4">{feature.description}</p>
              <Link href={feature.href} passHref>
                <Button variant="outline" size="sm" className="mt-auto gap-1">
                  Go to {feature.name} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Optional: Add a primary call to action, e.g., link to dashboard */}
        {/* <div className="flex justify-center mt-12">
          <Link href="/provider/dashboard">
            <Button size="lg" className="gap-1">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div> */}
      </div>
    </div>
  );
} 