'use server';

// import { supabaseAdmin } from '@/utils/supabase/admin'; // Removed unused import
import { createServerClient } from '@/utils/supabase/server';
import { getUserDb } from '@/lib/db/server';
import { isRecordNotFound, isUniqueViolation, type Prisma } from '@/lib/db';
import { publicOauthClientsInsertSchemaSchema } from '@/lib/database.schemas';
import { Argon2id } from 'oslo/password';
// import { randomBytes } from 'crypto'; // Removed unused import
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';
import {
  CreateOAuthClientInputSchema,
  type CreateOAuthClientInput,
  // UpdateOAuthClientInputSchema, // UNUSED in this file
  // type UpdateOAuthClientInput, // UNUSED in this file
  UpdateOAuthClientPayloadSchema,
  type UpdateOAuthClientPayload
} from './oauth-clients.schemas';

const LOG_PREFIX = '[ServerAction /developer/oauth-clients]';

// Columns returned to the developer dashboard. client_secret is never selected.
const listedClientFields = {
  client_id: true, client_name: true, client_uri: true, redirect_uris: true, logo_uri: true, scope: true,
  grant_types: true, response_types: true, created_at: true, owner_id: true, tos_uri: true, policy_uri: true,
} satisfies Prisma.oauth_clientsSelect;

const createdClientFields = {
  client_id: true, client_name: true, client_uri: true, redirect_uris: true, logo_uri: true, scope: true,
  grant_types: true, response_types: true, client_type: true, created_at: true, owner_id: true,
} satisfies Prisma.oauth_clientsSelect;

const updatedClientFields = {
  client_id: true, client_name: true, client_uri: true, redirect_uris: true, logo_uri: true, scope: true,
  grant_types: true, response_types: true, client_type: true, created_at: true, updated_at: true, owner_id: true,
  tos_uri: true, policy_uri: true,
} satisfies Prisma.oauth_clientsSelect;

// Helper to generate a secure client secret
function generateClientSecret(length = 40) {
  const E = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let t = "";
  for (let n = 0; n < length; n++) {
    t += E.charAt(Math.floor(Math.random() * E.length));
  }
  return t;
}

// Action to list OAuth clients for the authenticated developer
export async function listOAuthClients() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} listOAuthClients - Unauthorized access attempt.`);
    // In Server Actions, throwing an error or returning an object with an error is common.
    // For consistency, let's return an error object.
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  try {
    const db = await getUserDb();
    const clients = await db.oauth_clients.findMany({
      where: { owner_id: user.id, deleted_at: null },
      select: listedClientFields,
    });

    logger.info(`${LOG_PREFIX} listOAuthClients - Successfully fetched ${clients.length} clients for user ${user.id}.`);
    return { success: true, data: clients, status: 200 };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} listOAuthClients - Error fetching for user ${user.id}:`, { error: e });
    return { success: false, error: 'Failed to fetch OAuth clients', details: e.message, status: 500 };
  }
}

// Action to create a new OAuth client
export async function createOAuthClient(input: CreateOAuthClientInput) {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} createOAuthClient - Unauthorized access attempt.`);
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  const parsedInput = CreateOAuthClientInputSchema.safeParse(input);
  if (!parsedInput.success) {
    logger.warn(`${LOG_PREFIX} createOAuthClient - Invalid input for user ${user.id}:`, { errors: parsedInput.error.flatten() });
    return { success: false, error: 'Invalid input', details: parsedInput.error.flatten(), status: 400 };
  }

  const { client_name, redirect_uris, client_uri, logo_uri, scope, grant_types, response_types, tos_uri, policy_uri, client_type } = parsedInput.data;

  const clientId = uuidv4();
  const plainClientSecret = generateClientSecret();
  let hashedClientSecret;

  try {
    hashedClientSecret = await new Argon2id().hash(plainClientSecret);
  } catch (hashError: any) {
    logger.error(`${LOG_PREFIX} createOAuthClient - Failed to hash client secret for user ${user.id}:`, { error: hashError });
    return { success: false, error: 'Failed to secure client credentials', status: 500 };
  }

  try {
    const newClientData = {
      client_id: clientId,
      client_secret: hashedClientSecret,
      owner_id: user.id,
      client_name,
      redirect_uris,
      client_uri: client_uri || null,
      logo_uri: logo_uri || null,
      scope,
      grant_types: grant_types || ['authorization_code', 'refresh_token'],
      response_types: response_types || ['code'],
      tos_uri: tos_uri || null,
      policy_uri: policy_uri || null,
      client_type: client_type,
    };
    
    const finalValidation = publicOauthClientsInsertSchemaSchema.safeParse(newClientData);
    if (!finalValidation.success) {
      logger.error(`${LOG_PREFIX} createOAuthClient - Internal validation failed for user ${user.id}:`, { errors: finalValidation.error.flatten(), data: newClientData });
      return { success: false, error: 'Internal data validation error', details: finalValidation.error.flatten(), status: 500 };
    }

    const db = await getUserDb();
    let newClient;
    try {
      newClient = await db.oauth_clients.create({
        data: finalValidation.data,
        select: createdClientFields,
      });
    } catch (insertError: any) {
      logger.error(`${LOG_PREFIX} createOAuthClient - Error creating client for user ${user.id}:`, { error: insertError });
      if (isUniqueViolation(insertError)) {
          return { success: false, error: 'OAuth client could not be created due to a conflict.', details: insertError.message, status: 409 };
      }
      return { success: false, error: 'Failed to create OAuth client', details: insertError.message, status: 500 };
    }

    logger.info(`${LOG_PREFIX} createOAuthClient - Successfully created client ${newClient.client_id} for user ${user.id}.`);
    // Return the new client details INCLUDING the plainClientSecret for the user to copy one time.
    return { success: true, data: { ...newClient, client_secret: plainClientSecret }, status: 201 };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} createOAuthClient - Unexpected error for user ${user.id}:`, { error: e });
    return { success: false, error: 'An unexpected error occurred', details: e.message, status: 500 };
  }
}

// Action to get a specific OAuth client by ID
export async function getOAuthClient(clientId: string) {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} getOAuthClient - Unauthorized attempt for client ${clientId}.`);
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  try {
    const db = await getUserDb();
    const client = await db.oauth_clients.findFirst({
      where: { client_id: clientId, owner_id: user.id, deleted_at: null },
      select: listedClientFields,
    });

    if (!client) {
      logger.warn(`${LOG_PREFIX} getOAuthClient - Client ${clientId} not found for user ${user.id}.`);
      return { success: false, error: 'OAuth client not found or access denied', status: 404 };
    }

    logger.info(`${LOG_PREFIX} getOAuthClient - Successfully fetched client ${clientId} for user ${user.id}.`);
    return { success: true, data: client, status: 200 };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} getOAuthClient - Error fetching client ${clientId} for user ${user.id}:`, { error: e });
    return { success: false, error: 'Failed to fetch OAuth client', details: e.message, status: 500 };
  }
}

// Action to update an OAuth client
export async function updateOAuthClient(clientId: string, input: UpdateOAuthClientPayload) {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} updateOAuthClient - Unauthorized attempt for client ${clientId}.`);
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  if (Object.keys(input).length === 0) {
    return { success: false, error: 'Request body is empty, no fields to update', status: 400 };
  }

  const parsedInput = UpdateOAuthClientPayloadSchema.safeParse(input);
  if (!parsedInput.success) {
    logger.warn(`${LOG_PREFIX} updateOAuthClient - Invalid input for client ${clientId}, user ${user.id}:`, { errors: parsedInput.error.flatten() });
    return { success: false, error: 'Invalid input', details: parsedInput.error.flatten(), status: 400 };
  }

  const dataToUpdate: { [key: string]: any } = { updated_at: new Date() };
  
  for (const key in parsedInput.data) {
    if (Object.prototype.hasOwnProperty.call(parsedInput.data, key)) {
      const value = (parsedInput.data as any)[key];
      if (value !== undefined) {
        dataToUpdate[key] = value;
      }
    }
  }

  const db = await getUserDb();
  const clientWhere = { client_id: clientId, owner_id: user.id, deleted_at: null };

  if (Object.keys(dataToUpdate).length === 1 && dataToUpdate.updated_at) {
    try {
      const currentClient = await db.oauth_clients.findFirst({
        where: clientWhere,
        select: updatedClientFields,
      });
      if (currentClient) {
        logger.info(`${LOG_PREFIX} updateOAuthClient - No actual changes for client ${clientId}.`);
        return { success: true, data: currentClient, status: 200 };
      }
      logger.error(`${LOG_PREFIX} updateOAuthClient - Failed to fetch current client data for no-op update`, { clientId });
    } catch (currentError) {
      logger.error(`${LOG_PREFIX} updateOAuthClient - Failed to fetch current client data for no-op update`, { clientId, error: currentError });
    }
    return { success: false, error: 'Failed to retrieve client details after no-op update', status: 500 };
  }

  try {
    const updatedClient = await db.oauth_clients.update({
      where: clientWhere,
      data: dataToUpdate,
      select: updatedClientFields,
    });

    logger.info(`${LOG_PREFIX} updateOAuthClient - Successfully updated client ${clientId} for user ${user.id}.`);
    return { success: true, data: updatedClient, status: 200 };

  } catch (e: any) {
    if (isRecordNotFound(e)) {
      logger.warn(`${LOG_PREFIX} updateOAuthClient - Client ${clientId} not found for update for user ${user.id}.`);
      return { success: false, error: 'OAuth client not found or access denied', status: 404 };
    }
    logger.error(`${LOG_PREFIX} updateOAuthClient - Error updating client ${clientId} for user ${user.id}:`, { error: e });
    return { success: false, error: 'Failed to update OAuth client', details: e.message, status: 500 };
  }
}

// Action to delete an OAuth client (soft delete)
export async function deleteOAuthClient(clientId: string) {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} deleteOAuthClient - Unauthorized attempt for client ${clientId}.`);
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  try {
    const db = await getUserDb();
    const { count } = await db.oauth_clients.updateMany({
      where: { client_id: clientId, owner_id: user.id, deleted_at: null },
      data: { deleted_at: new Date() },
    });

    if (count === 0) {
      logger.warn(`${LOG_PREFIX} deleteOAuthClient - Client ${clientId} not found or already deleted for user ${user.id}.`);
      return { success: false, error: 'OAuth client not found, already deleted, or access denied', status: 404 };
    }

    logger.info(`${LOG_PREFIX} deleteOAuthClient - Successfully soft-deleted client ${clientId} for user ${user.id}.`);
    return { success: true, message: 'OAuth client successfully deleted', status: 200 };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} deleteOAuthClient - Error deleting client ${clientId} for user ${user.id}:`, { error: e });
    return { success: false, error: 'Failed to delete OAuth client', details: e.message, status: 500 };
  }
}

// Action to reset an OAuth client's secret
export async function resetOAuthClientSecret(clientId: string) {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} resetOAuthClientSecret - Unauthorized attempt for client ${clientId}.`);
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  const plainClientSecret = generateClientSecret();
  let hashedClientSecret;
  try {
    hashedClientSecret = await new Argon2id().hash(plainClientSecret);
  } catch (hashError: any) {
    logger.error(`${LOG_PREFIX} resetOAuthClientSecret - Failed to hash new secret for client ${clientId}, user ${user.id}:`, { error: hashError });
    return { success: false, error: 'Failed to secure new client credentials', status: 500 };
  }

  try {
    const db = await getUserDb();
    await db.oauth_clients.update({
      where: { client_id: clientId, owner_id: user.id, deleted_at: null },
      data: { client_secret: hashedClientSecret, updated_at: new Date() },
      select: { client_id: true },
    });

    logger.info(`${LOG_PREFIX} resetOAuthClientSecret - Successfully reset secret for ${clientId}, user ${user.id}.`);
    return { success: true, data: { client_id: clientId, client_secret: plainClientSecret }, message: 'Client secret has been reset. Please save the new secret.', status: 200 };

  } catch (e: any) {
    if (isRecordNotFound(e)) {
      logger.warn(`${LOG_PREFIX} resetOAuthClientSecret - Client ${clientId} not found for secret reset for user ${user.id}.`);
      return { success: false, error: 'OAuth client not found or access denied', status: 404 };
    }
    logger.error(`${LOG_PREFIX} resetOAuthClientSecret - Error updating secret for ${clientId}, user ${user.id}:`, { error: e });
    return { success: false, error: 'Failed to reset client secret', details: e.message, status: 500 };
  }
} 