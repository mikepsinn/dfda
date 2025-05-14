'use client';

import { useState, type FormEvent } from 'react';
// import { redirect } from 'next/navigation'; // No longer needed here
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logger } from '@/lib/logger';
import Image from 'next/image';
import { Check, X, ShieldQuestion, Loader2 } from 'lucide-react';

import { handleConsent, type HandleConsentResult } from '@/lib/actions/oauth/authorize.actions';

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

  const handleSubmitDecision = async (decision: 'approve' | 'deny') => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('decision', decision);
    formData.append('client_id', client.client_id);
    formData.append('redirect_uri', redirect_uri);
    if (scopes) {
      formData.append('scope', scopes.join(' '));
    }
    if (csrfToken) { // csrfToken from props is the OAuth 'state' parameter
      formData.append('state', csrfToken);
    }
    if (code_challenge) {
      formData.append('code_challenge', code_challenge);
    }
    if (code_challenge_method) {
      formData.append('code_challenge_method', code_challenge_method);
    }

    try {
      const result: HandleConsentResult = await handleConsent(formData);
      if (result.success) {
        window.location.href = result.redirect_to;
      } else {
        logger.error('[ConsentForm] Consent handling failed:', { error: result.error, description: result.error_description });
        setError(result.error_description || result.error || 'An unexpected error occurred.');
      }
    } catch (e: any) {
      logger.error('[ConsentForm] Error submitting consent decision:', { error: e });
      setError('An unexpected client-side error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  const handleSubmitApprove = (event: FormEvent<HTMLFormElement> | FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    handleSubmitDecision('approve');
  };

  const handleSubmitDeny = (event: FormEvent<HTMLFormElement> | FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    handleSubmitDecision('deny');
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
          <Button type="submit" onClick={handleSubmitApprove} disabled={isLoading} className="mr-2">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Check className="mr-2 h-4 w-4" /> Allow Access</>}
          </Button>
          <Button type="button" variant="outline" onClick={handleSubmitDeny} disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><X className="mr-2 h-4 w-4"/> Deny Access</>}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 