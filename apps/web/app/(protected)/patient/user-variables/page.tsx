import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserVariablesWithDetailsAction } from '@/lib/actions/user-variables';
import { UserVariableList } from '@/components/patient/UserVariableList';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

export default async function UserVariablesPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("UserVariablesPage: User not authenticated, redirecting.", { error: authError });
    redirect('/login');
  }

  // Fetch user variables using the action
  const { data: variables, error: fetchError, success } = await getUserVariablesWithDetailsAction(user.id);

  if (!success || fetchError) {
     logger.error("UserVariablesPage: Failed to fetch user variables", { userId: user.id, error: fetchError });
    // Display an error message on the page
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">My Tracked Variables</h1>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Variables</AlertTitle>
                <AlertDescription>
                    There was an error fetching your tracked variables. Please try again later.
                    {fetchError && <p className="mt-2 text-xs">Details: {fetchError}</p>}
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  // Render the list component with the fetched data
  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Tracked Variables</h1>
        <UserVariableList variables={variables || []} />
    </div>
  );
} 