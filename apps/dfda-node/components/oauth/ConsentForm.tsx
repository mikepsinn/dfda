'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logger } from '@/lib/logger';
import Image from 'next/image';
import { Check, X, ShieldQuestion, Loader2 } from 'lucide-react';

// We will create this server action in the next step
// import { handleConsent } from '@/lib/actions/oauth/authorize.actions';

export interface ConsentFormProps {
  client: {
    client_id: string;
    client_name: string;
    logo_uri?: string | null;
  };
  user: {
    email?: string | null;
  };
  scopes: string[];
  csrfToken?: string | null; // Will be passed as 'state' from the authorize page
  code_challenge?: string | null;
  code_challenge_method?: string | null;
  redirect_uri: string;
}

export function ConsentForm({
  client,
  user,
  scopes,
  csrfToken,
  code_challenge,
  code_challenge_method,
  redirect_uri,
}: ConsentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This will eventually call a server action
  const handleSubmit = async (event: FormEvent<HTMLFormElement>, decision: 'approve' | 'deny') => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    logger.info('Consent form submitted', { decision, client_id: client.client_id, user_email: user.email });

    // Placeholder for server action call
    // const formData = new FormData(event.currentTarget);
    // formData.append('decision', decision);
    // formData.append('client_id', client.client_id);
    // formData.append('redirect_uri', redirect_uri);
    // formData.append('state', csrfToken || '');
    // if (code_challenge) formData.append('code_challenge', code_challenge);
    // if (code_challenge_method) formData.append('code_challenge_method', code_challenge_method);
    // formData.append('scope', scopes.join(' '));

    try {
      // const result = await handleConsent(formData);
      // if (result.redirect_to) {
      //   window.location.href = result.redirect_to; // Perform client-side redirect
      // } else if (result.error) {
      //   setError(result.error_description || result.error || 'An unknown error occurred.');
      // }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      if (decision === 'approve') {
        logger.info('Simulated approval successful');
        // In a real scenario, the server action would handle the redirect.
        // For now, we can simulate a redirect or show a message.
        alert(`Approved! Would redirect to ${redirect_uri} with a code.`);
      } else {
        logger.info('Simulated denial successful');
        alert(`Denied! Would redirect to ${redirect_uri} with an error.`);
      }
    } catch (e: any) {
      logger.error('Error handling consent submission', { error: e });
      setError(e.message || 'An unexpected error occurred while processing your request.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {client.logo_uri ? (
            <Image 
              src={client.logo_uri} 
              alt={`${client.client_name} logo`} 
              width={64} 
              height={64} 
              className="mx-auto mb-4 rounded-full object-contain" 
            />
          ) : (
            <ShieldQuestion className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          )}
          <CardTitle className="text-xl">Authorize Application</CardTitle>
          <CardDescription>
            <span className="font-semibold">{client.client_name}</span> wants to access your account 
            ({user.email}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">This application will be able to:</h3>
            <ul className="mt-1 list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {scopes.map((scope) => (
                <li key={scope}>{scope.charAt(0).toUpperCase() + scope.slice(1)}</li> // Simple scope formatting
              ))}
            </ul>
            {scopes.length === 0 && <p className="text-sm text-gray-500">No specific permissions requested (default access).</p>}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By authorizing this application, you allow it to perform the actions listed above on your behalf. 
            You can revoke this access at any time in your application settings.
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-4">
          <form onSubmit={(e) => handleSubmit(e, 'deny')} className="w-full">
            <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />} 
              Deny
            </Button>
          </form>
          <form onSubmit={(e) => handleSubmit(e, 'approve')} className="w-full">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} 
              Approve
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
} 