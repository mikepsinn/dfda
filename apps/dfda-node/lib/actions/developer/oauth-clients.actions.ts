'use server';

import { createClient } from '@/utils/supabase/server';
import { publicOauthClientsInsertSchemaSchema, publicOauthClientsUpdateSchemaSchema } from '@/lib/database.schemas';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Argon2id } from 'oslo/password';
import { logger } from '@/lib/logger';

const LOG_PREFIX = '[ServerAction /developer/oauth-clients]';

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
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} listOAuthClients - Unauthorized access attempt.`);
    // In Server Actions, throwing an error or returning an object with an error is common.
    // For consistency, let's return an error object.
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  try {
    const { data: clients, error } = await supabase
      .from('oauth_clients')
      .select('client_id, client_name, client_uri, redirect_uris, logo_uri, scope, grant_types, response_types, created_at, owner_id, tos_uri, policy_uri') // Exclude client_secret
      .eq('owner_id', user.id)
      .is('deleted_at', null);

    if (error) {
      logger.error(`${LOG_PREFIX} listOAuthClients - Error fetching for user ${user.id}:`, { error });
      return { success: false, error: 'Failed to fetch OAuth clients', details: error.message, status: 500 };
    }

    logger.info(`${LOG_PREFIX} listOAuthClients - Successfully fetched ${clients.length} clients for user ${user.id}.`);
    return { success: true, data: clients, status: 200 };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} listOAuthClients - Unexpected error for user ${user.id}:`, { error: e });
    return { success: false, error: 'An unexpected error occurred', details: e.message, status: 500 };
  }
}

// Zod schema for validating the input to createOAuthClient action
// Derived from the previous CreateClientRequestBodySchema
export const CreateOAuthClientInputSchema = publicOauthClientsInsertSchemaSchema.pick({
  client_name: true,
  client_uri: true,
  redirect_uris: true,
  logo_uri: true,
  scope: true,
  grant_types: true,
  response_types: true,
  tos_uri: true,
  policy_uri: true,
}).extend({
    redirect_uris: z.array(z.string().url({ message: "Invalid redirect URI format." })).min(1, "At least one redirect URI is required."),
    client_name: z.string().min(1, "Client name is required."),
    scope: z.string().default('openid email profile'),
    grant_types: z.array(z.string()).default(['authorization_code', 'refresh_token']),
    response_types: z.array(z.string()).default(['code'])
});

export type CreateOAuthClientInput = z.infer<typeof CreateOAuthClientInputSchema>;

// Action to create a new OAuth client
export async function createOAuthClient(input: CreateOAuthClientInput) {
  const supabase = await createClient();
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

  const { client_name, redirect_uris, client_uri, logo_uri, scope, grant_types, response_types, tos_uri, policy_uri } = parsedInput.data;

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
    };
    
    const finalValidation = publicOauthClientsInsertSchemaSchema.safeParse(newClientData);
    if (!finalValidation.success) {
      logger.error(`${LOG_PREFIX} createOAuthClient - Internal validation failed for user ${user.id}:`, { errors: finalValidation.error.flatten(), data: newClientData });
      return { success: false, error: 'Internal data validation error', details: finalValidation.error.flatten(), status: 500 };
    }

    const { data: newClient, error: insertError } = await supabase
      .from('oauth_clients')
      .insert(finalValidation.data)
      .select('client_id, client_name, client_uri, redirect_uris, logo_uri, scope, grant_types, response_types, created_at, owner_id')
      .single();

    if (insertError) {
      logger.error(`${LOG_PREFIX} createOAuthClient - Error creating client for user ${user.id}:`, { error: insertError });
      if (insertError.code === '23505') {
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
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} getOAuthClient - Unauthorized attempt for client ${clientId}.`);
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  try {
    const { data: client, error } = await supabase
      .from('oauth_clients')
      .select('client_id, client_name, client_uri, redirect_uris, logo_uri, scope, grant_types, response_types, created_at, owner_id, tos_uri, policy_uri')
      .eq('client_id', clientId)
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      logger.error(`${LOG_PREFIX} getOAuthClient - Error fetching client ${clientId} for user ${user.id}:`, { error });
      return { success: false, error: 'Failed to fetch OAuth client', details: error.message, status: 500 };
    }

    if (!client) {
      logger.warn(`${LOG_PREFIX} getOAuthClient - Client ${clientId} not found for user ${user.id}.`);
      return { success: false, error: 'OAuth client not found or access denied', status: 404 };
    }

    logger.info(`${LOG_PREFIX} getOAuthClient - Successfully fetched client ${clientId} for user ${user.id}.`);
    return { success: true, data: client, status: 200 };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} getOAuthClient - Unexpected error for client ${clientId}, user ${user.id}:`, { error: e });
    return { success: false, error: 'An unexpected error occurred', details: e.message, status: 500 };
  }
}

// Zod schema for updating an OAuth client
export const UpdateOAuthClientInputSchema = publicOauthClientsUpdateSchemaSchema.pick({
  client_name: true,
  client_uri: true,
  redirect_uris: true,
  logo_uri: true,
  scope: true,
  grant_types: true,
  response_types: true,
  tos_uri: true,
  policy_uri: true,
}).partial().extend({
    redirect_uris: z.array(z.string().url({ message: "Invalid redirect URI format." })).min(1, "At least one redirect URI is required.").optional(),
    client_name: z.string().min(1, "Client name cannot be empty.").optional(),
});
export type UpdateOAuthClientInput = z.infer<typeof UpdateOAuthClientInputSchema>;

// Action to update an OAuth client
export async function updateOAuthClient(clientId: string, input: UpdateOAuthClientInput) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} updateOAuthClient - Unauthorized attempt for client ${clientId}.`);
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  if (Object.keys(input).length === 0) {
    return { success: false, error: 'Request body is empty, no fields to update', status: 400 };
  }

  const parsedInput = UpdateOAuthClientInputSchema.safeParse(input);
  if (!parsedInput.success) {
    logger.warn(`${LOG_PREFIX} updateOAuthClient - Invalid input for client ${clientId}, user ${user.id}:`, { errors: parsedInput.error.flatten() });
    return { success: false, error: 'Invalid input', details: parsedInput.error.flatten(), status: 400 };
  }

  const updateData = { ...parsedInput.data, updated_at: new Date().toISOString() };

  try {
    const { data: updatedClient, error: updateError } = await supabase
      .from('oauth_clients')
      .update(updateData)
      .eq('client_id', clientId)
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .select('client_id, client_name, client_uri, redirect_uris, logo_uri, scope, grant_types, response_types, created_at, updated_at, owner_id, tos_uri, policy_uri')
      .single();

    if (updateError) {
      logger.error(`${LOG_PREFIX} updateOAuthClient - Error updating client ${clientId} for user ${user.id}:`, { error: updateError });
      if (updateError.code === 'PGRST204') {
         logger.warn(`${LOG_PREFIX} updateOAuthClient - Client ${clientId} not found for update for user ${user.id}.`);
         return { success: false, error: 'OAuth client not found or access denied', status: 404 };
      }
      return { success: false, error: 'Failed to update OAuth client', details: updateError.message, status: 500 };
    }
    
    if (!updatedClient) {
        logger.warn(`${LOG_PREFIX} updateOAuthClient - Client ${clientId} not found post-update for user ${user.id}.`);
        return { success: false, error: 'OAuth client not found or update failed', status: 404 };
    }

    logger.info(`${LOG_PREFIX} updateOAuthClient - Successfully updated client ${clientId} for user ${user.id}.`);
    return { success: true, data: updatedClient, status: 200 };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} updateOAuthClient - Unexpected error for client ${clientId}, user ${user.id}:`, { error: e });
    return { success: false, error: 'An unexpected error occurred', details: e.message, status: 500 };
  }
}

// Action to delete an OAuth client (soft delete)
export async function deleteOAuthClient(clientId: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    logger.warn(`${LOG_PREFIX} deleteOAuthClient - Unauthorized attempt for client ${clientId}.`);
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  try {
    const { error: deleteError, count } = await supabase
      .from('oauth_clients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .eq('owner_id', user.id)
      .is('deleted_at', null);
      
    if (deleteError) {
      logger.error(`${LOG_PREFIX} deleteOAuthClient - Error deleting client ${clientId} for user ${user.id}:`, { error: deleteError });
      return { success: false, error: 'Failed to delete OAuth client', details: deleteError.message, status: 500 };
    }

    if (count === 0) {
      logger.warn(`${LOG_PREFIX} deleteOAuthClient - Client ${clientId} not found or already deleted for user ${user.id}.`);
      return { success: false, error: 'OAuth client not found, already deleted, or access denied', status: 404 };
    }

    logger.info(`${LOG_PREFIX} deleteOAuthClient - Successfully soft-deleted client ${clientId} for user ${user.id}.`);
    return { success: true, message: 'OAuth client successfully deleted', status: 200 };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} deleteOAuthClient - Unexpected error for client ${clientId}, user ${user.id}:`, { error: e });
    return { success: false, error: 'An unexpected error occurred', details: e.message, status: 500 };
  }
}

// Action to reset an OAuth client's secret
export async function resetOAuthClientSecret(clientId: string) {
  const supabase = await createClient();
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
    const { data: updatedClient, error: updateError } = await supabase
      .from('oauth_clients')
      .update({ client_secret: hashedClientSecret, updated_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .eq('owner_id', user.id)
      .is('deleted_at', null)
      .select('client_id')
      .single();

    if (updateError) {
      logger.error(`${LOG_PREFIX} resetOAuthClientSecret - Error updating secret for ${clientId}, user ${user.id}:`, { error: updateError });
      if (updateError.code === 'PGRST204') { 
         logger.warn(`${LOG_PREFIX} resetOAuthClientSecret - Client ${clientId} not found for secret reset for user ${user.id}.`);
         return { success: false, error: 'OAuth client not found or access denied', status: 404 };
      }
      return { success: false, error: 'Failed to reset client secret', details: updateError.message, status: 500 };
    }
    
    if (!updatedClient) {
        logger.warn(`${LOG_PREFIX} resetOAuthClientSecret - Client ${clientId} not found post-update for user ${user.id}.`);
        return { success: false, error: 'OAuth client not found or secret reset failed', status: 404 };
    }

    logger.info(`${LOG_PREFIX} resetOAuthClientSecret - Successfully reset secret for ${clientId}, user ${user.id}.`);
    return { success: true, data: { client_id: clientId, client_secret: plainClientSecret }, message: 'Client secret has been reset. Please save the new secret.', status: 200 };

  } catch (e: any) {
    logger.error(`${LOG_PREFIX} resetOAuthClientSecret - Unexpected error for client ${clientId}, user ${user.id}:`, { error: e });
    return { success: false, error: 'An unexpected error occurred', details: e.message, status: 500 };
  }
} 