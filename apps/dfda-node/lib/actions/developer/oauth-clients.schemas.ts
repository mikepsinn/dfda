import { z } from 'zod';
import { publicOauthClientsInsertSchemaSchema, publicOauthClientsUpdateSchemaSchema } from '@/lib/database.schemas';

const clientTypeEnum = z.enum(['public', 'confidential']);

// Zod schema for validating the input to createOAuthClient action
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
  // client_type will be part of publicOauthClientsInsertSchemaSchema once db types are updated
  // We add it here explicitly for form validation and to set a default.
}).extend({
    redirect_uris: z.array(z.string().url({ message: "Invalid redirect URI format." })).min(1, "At least one redirect URI is required."),
    client_name: z.string().min(1, "Client name is required."),
    scope: z.string().default('openid email profile'), // Default scope
    grant_types: z.array(z.string()).default(['authorization_code', 'refresh_token']),
    response_types: z.array(z.string()).default(['code']),
    client_type: clientTypeEnum.default('confidential'), // Added for form input
});

export type CreateOAuthClientInput = z.infer<typeof CreateOAuthClientInputSchema>;

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
  // client_type will be part of publicOauthClientsUpdateSchemaSchema once db types are updated
}).partial().extend({
    redirect_uris: z.array(z.string().url({ message: "Invalid redirect URI format." })).min(1, "At least one redirect URI is required.").optional(),
    client_name: z.string().min(1, "Client name cannot be empty.").optional(),
    client_type: clientTypeEnum.optional(), // Added for form input
    // Note: grant_types and response_types are typically not updated this way.
    // If they were to be updatable, they would need to be added here.
});

export type UpdateOAuthClientInput = z.infer<typeof UpdateOAuthClientInputSchema>; 