import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { UserVariableDetailView } from '@/components/patient/UserVariableDetailView';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
  params: {
    userVariableId: string;
  };
}

export default async function UserVariableDetailPage({ params }: PageProps) {
  const { userVariableId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("UserVariableDetailPage: User not authenticated, redirecting.", { error: authError, userVariableId });
    redirect('/login');
  }

  // Basic validation for the ID format if needed
  if (!userVariableId) { // Add more robust validation if needed (e.g., UUID check)
      logger.error("UserVariableDetailPage: Invalid userVariableId param", { param: userVariableId });
      return (
           <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Invalid Page URL</AlertTitle>
                    <AlertDescription>The variable ID in the URL is invalid.</AlertDescription>
                </Alert>
            </div>
      );
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
        <UserVariableDetailView userId={user.id} userVariableId={userVariableId} />
    </div>
  );
} 