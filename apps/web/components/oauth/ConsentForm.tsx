'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logger } from '@/lib/logger';
import { authClient } from '@/lib/auth-client';
import { Check, X, ShieldQuestion, Loader2 } from 'lucide-react';

// Plain-language names of the OAuth scopes (lib/auth.ts).
const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: 'Confirm who you are',
  profile: 'See your name and picture',
  email: 'See your email address',
  offline_access: 'Stay connected when you are not using it',
};

export interface ConsentFormProps {
  client: {
    name: string;
    icon?: string | null;
    uri?: string | null;
  };
  user: {
    email?: string | null;
  };
  scopes: string[];
}

export function ConsentForm({ client, user, scopes }: ConsentFormProps) {
  const [isLoading, setIsLoading] = useState<'approve' | 'deny' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitDecision = async (decision: 'approve' | 'deny') => {
    setIsLoading(decision);
    setError(null);

    // The client plugin adds the signed query of this page to the request.
    const { data, error } = await authClient.oauth2.consent({ accept: decision === 'approve' });
    const target = (data as { url?: string; redirect_uri?: string } | null)?.url
      ?? (data as { redirect_uri?: string } | null)?.redirect_uri;
    if (error || !target) {
      logger.error('[ConsentForm] Consent handling failed', { status: error?.status });
      setError('Could not complete the authorization. Please start again from the application.');
      setIsLoading(null);
      return;
    }
    window.location.assign(target);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {client.icon ? (
            // eslint-disable-next-line @next/next/no-img-element -- the icon is on the client's own host
            <img
              src={client.icon}
              alt={`${client.name} logo`}
              width={64}
              height={64}
              className="mx-auto mb-4 rounded-full object-contain"
            />
          ) : (
            <ShieldQuestion className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          )}
          <CardTitle className="text-xl">Authorize Application</CardTitle>
          <CardDescription>
            <span className="font-semibold">{client.name}</span> wants to access your account
            ({user.email}).
            {client.uri && <span className="block mt-1 text-xs">{client.uri}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">This application will be able to:</h3>
            <ul className="mt-1 list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {scopes.map((scope) => (
                <li key={scope}>{SCOPE_DESCRIPTIONS[scope] ?? scope}</li>
              ))}
            </ul>
            {scopes.length === 0 && <p className="text-sm text-gray-500">No specific permissions requested (default access).</p>}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By authorizing this application, you allow it to perform the actions listed above on your behalf.
          </p>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-4">
          <Button type="button" onClick={() => submitDecision('approve')} disabled={isLoading !== null}>
            {isLoading === 'approve' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Check className="mr-2 h-4 w-4" /> Allow Access</>}
          </Button>
          <Button type="button" variant="outline" onClick={() => submitDecision('deny')} disabled={isLoading !== null}>
            {isLoading === 'deny' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><X className="mr-2 h-4 w-4"/> Deny Access</>}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
