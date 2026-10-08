import { redirect } from 'next/navigation';
import { verifyOAuthQueryParams } from '@better-auth/oauth-provider';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/db';
import { getServerUser } from '@/lib/server-auth';
import { logger } from '@/lib/logger';
import { ConsentForm } from '@/components/oauth/ConsentForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function ConsentError({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Authorization failed</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Consent page of the OAuth provider (consentPage in lib/auth.ts). The
 * authorization endpoint sends the user here with a signed query that names
 * the client and the requested scopes. Approving or denying returns the
 * user to the client.
 */
export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      query.append(key, item);
    }
  }

  // The signature proves that the authorization endpoint made this query.
  const { secret } = await auth.$context;
  if (!(await verifyOAuthQueryParams(query.toString(), secret))) {
    logger.warn('OAuth consent page opened with a query that is not valid or has expired');
    return <ConsentError message="This authorization request is not valid or has expired. Start again from the application." />;
  }

  const user = await getServerUser();
  if (!user) {
    redirect(`/login?${query.toString()}`);
  }

  const clientId = query.get('client_id') ?? '';
  const client = await adminDb.oauth_clients.findUnique({
    where: { clientId },
    select: { name: true, icon: true, uri: true, disabled: true },
  });
  if (!client || client.disabled) {
    logger.warn('OAuth consent page for an unknown or disabled client', { clientId });
    return <ConsentError message="This application is not registered." />;
  }

  const scopes = (query.get('scope') ?? '').split(' ').filter(Boolean);

  return (
    <ConsentForm
      client={{ name: client.name || 'Unknown Application', icon: client.icon, uri: client.uri }}
      user={{ email: user.email }}
      scopes={scopes}
    />
  );
}

export const dynamic = 'force-dynamic';
