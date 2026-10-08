'use server';

import { headers } from 'next/headers';
import { APIError } from 'better-auth/api';
import { auth } from '@/lib/auth';
import { getServerUser } from '@/lib/server-auth';
import { logger } from '@/lib/logger';
import {
  CreateOAuthClientInputSchema,
  type CreateOAuthClientInput,
  type OAuthClientSummary,
  UpdateOAuthClientPayloadSchema,
  type UpdateOAuthClientPayload
} from './oauth-clients.schemas';

const LOG_PREFIX = '[ServerAction /developer/oauth-clients]';

/*
 * OAuth clients of the signed-in developer. Better Auth's OAuth provider
 * (lib/auth.ts) stores the clients, hashes their secrets and checks that the
 * session user owns each client it changes.
 */

// A client in the OAuth (RFC 7591) format that Better Auth returns.
type ProviderClient = {
  client_id: string;
  client_secret?: string;
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  tos_uri?: string;
  policy_uri?: string;
  redirect_uris?: string[];
  scope?: string;
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
  client_id_issued_at?: number;
  user_id?: string;
};

function toSummary(client: ProviderClient): OAuthClientSummary {
  return {
    client_id: client.client_id,
    client_name: client.client_name ?? null,
    client_uri: client.client_uri ?? null,
    redirect_uris: client.redirect_uris ?? [],
    logo_uri: client.logo_uri ?? null,
    scope: client.scope ?? null,
    grant_types: client.grant_types ?? [],
    response_types: client.response_types ?? [],
    client_type: client.token_endpoint_auth_method === 'none' ? 'public' : 'confidential',
    created_at: client.client_id_issued_at ? new Date(client.client_id_issued_at * 1000).toISOString() : null,
    owner_id: client.user_id ?? null,
    tos_uri: client.tos_uri ?? null,
    policy_uri: client.policy_uri ?? null,
  };
}

// The result shape the developer dashboard reads.
type ActionResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  message?: string;
  status: number;
};

function failure(action: string, error: unknown, fallback: string): ActionResult<never> {
  if (error instanceof APIError) {
    logger.warn(`${LOG_PREFIX} ${action} refused`, { status: error.status, message: error.message });
    const status = typeof error.statusCode === 'number' ? error.statusCode : 400;
    if (status === 404) return { success: false, error: 'OAuth client not found or access denied', status };
    return { success: false, error: error.message || fallback, status };
  }
  logger.error(`${LOG_PREFIX} ${action} failed`, { error: error instanceof Error ? error.message : error });
  return { success: false, error: fallback, status: 500 };
}

const unauthorized: ActionResult<never> = { success: false, error: 'Unauthorized', status: 401 };

// Action to list OAuth clients for the authenticated developer
export async function listOAuthClients(): Promise<ActionResult<OAuthClientSummary[]>> {
  const user = await getServerUser();
  if (!user) return unauthorized;

  try {
    const clients = (await auth.api.getOAuthClients({ headers: await headers() })) as ProviderClient[];
    return { success: true, data: clients.map(toSummary), status: 200 };
  } catch (error) {
    return failure('listOAuthClients', error, 'Failed to fetch OAuth clients');
  }
}

// Action to create a new OAuth client. The secret is returned once.
export async function createOAuthClient(input: CreateOAuthClientInput): Promise<ActionResult<OAuthClientSummary & { client_secret?: string }>> {
  const user = await getServerUser();
  if (!user) return unauthorized;

  const parsedInput = CreateOAuthClientInputSchema.safeParse(input);
  if (!parsedInput.success) {
    logger.warn(`${LOG_PREFIX} createOAuthClient - Invalid input for user ${user.id}:`, { errors: parsedInput.error.flatten() });
    return { success: false, error: 'Invalid input', details: parsedInput.error.flatten(), status: 400 };
  }

  const { client_type, ...metadata } = parsedInput.data;
  try {
    const client = (await auth.api.createOAuthClient({
      body: {
        ...metadata,
        token_endpoint_auth_method: client_type === 'public' ? 'none' : 'client_secret_basic',
      },
      headers: await headers(),
    })) as ProviderClient;
    logger.info(`${LOG_PREFIX} createOAuthClient - Created client ${client.client_id} for user ${user.id}.`);
    return { success: true, data: { ...toSummary(client), client_secret: client.client_secret }, status: 201 };
  } catch (error) {
    return failure('createOAuthClient', error, 'Failed to create OAuth client');
  }
}

// Action to update an OAuth client
export async function updateOAuthClient(clientId: string, input: UpdateOAuthClientPayload): Promise<ActionResult<OAuthClientSummary>> {
  const user = await getServerUser();
  if (!user) return unauthorized;

  const parsedInput = UpdateOAuthClientPayloadSchema.safeParse(input);
  if (!parsedInput.success) {
    logger.warn(`${LOG_PREFIX} updateOAuthClient - Invalid input for client ${clientId}, user ${user.id}:`, { errors: parsedInput.error.flatten() });
    return { success: false, error: 'Invalid input', details: parsedInput.error.flatten(), status: 400 };
  }

  const update = parsedInput.data;
  try {
    const client = (await auth.api.updateOAuthClient({
      body: { client_id: clientId, update },
      headers: await headers(),
    })) as ProviderClient;
    logger.info(`${LOG_PREFIX} updateOAuthClient - Updated client ${clientId} for user ${user.id}.`);
    return { success: true, data: toSummary(client), status: 200 };
  } catch (error) {
    return failure('updateOAuthClient', error, 'Failed to update OAuth client');
  }
}

// Action to delete an OAuth client
export async function deleteOAuthClient(clientId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) return unauthorized;

  try {
    await auth.api.deleteOAuthClient({ body: { client_id: clientId }, headers: await headers() });
    logger.info(`${LOG_PREFIX} deleteOAuthClient - Deleted client ${clientId} for user ${user.id}.`);
    return { success: true, message: 'OAuth client successfully deleted', status: 200 };
  } catch (error) {
    return failure('deleteOAuthClient', error, 'Failed to delete OAuth client');
  }
}

// Action to reset an OAuth client's secret. The new secret is returned once.
export async function resetOAuthClientSecret(clientId: string): Promise<ActionResult<{ client_id: string; client_secret?: string }>> {
  const user = await getServerUser();
  if (!user) return unauthorized;

  try {
    const client = (await auth.api.rotateClientSecret({ body: { client_id: clientId }, headers: await headers() })) as ProviderClient;
    logger.info(`${LOG_PREFIX} resetOAuthClientSecret - Reset secret for ${clientId}, user ${user.id}.`);
    return {
      success: true,
      data: { client_id: clientId, client_secret: client.client_secret },
      message: 'Client secret has been reset. Please save the new secret.',
      status: 200,
    };
  } catch (error) {
    return failure('resetOAuthClientSecret', error, 'Failed to reset client secret');
  }
}
