import { createClient } from "@/utils/supabase/server";
import { UserVariableDetailView } from "@/components/patient/UserVariableDetailView";
import { getUserVariableDetailsAction } from "@/lib/actions/user-variables"; // Action to fetch details
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";
import { format } from 'date-fns'; // For formatting today's date if needed
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface UserVariableDetailPageProps {
  params: { userVariableId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function UserVariableDetailPage({ params, searchParams }: UserVariableDetailPageProps) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("User not authenticated, redirecting to login from UserVariableDetailPage", { userVariableId: params.userVariableId });
    redirect("/login?message=Please log in to view this page.");
  }

  const { userVariableId } = params;

  // Fetch user variable details
  const variableDetailsResult = await getUserVariableDetailsAction(userVariableId, user.id);

  if (!variableDetailsResult.success || !variableDetailsResult.data) {
    logger.error("Failed to load variable details for page", { userId: user.id, userVariableId, error: variableDetailsResult.error });
    // You could redirect to a 404 page or show an error message
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-semibold mb-4">Variable Not Found</h1>
        <p>The requested variable details could not be loaded. It may not exist or you may not have permission to view it.</p>
        <p className="text-sm text-muted-foreground">Error: {variableDetailsResult.error || "Unknown error"}</p>
      </div>
    );
  }

  const userVariable = variableDetailsResult.data;

  // Determine currentDate from searchParams or default to today
  // Ensuring currentDate is in YYYY-MM-DD format
  const dateQuery = searchParams.date;
  let currentDateString: string;
  if (typeof dateQuery === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateQuery)) {
    currentDateString = dateQuery;
  } else {
    currentDateString = format(new Date(), 'yyyy-MM-dd');
    // Optionally, redirect to URL with date if you want canonical URLs
    // logger.info(`Defaulting to today: ${currentDateString}. Consider redirecting if date param is important.`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <Link href="/patient/user-variables" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to My Variables
        </Link>
        {/* 
          The UserVariableDetailView component handles fetching its own data 
          and displaying loading/error states internally based on those fetches.
          We pass the necessary IDs down to it. 
        */}
        <UserVariableDetailView 
            userId={user.id} 
            userVariable={userVariable} 
            currentDate={currentDateString} 
        />
    </div>
  );
} 