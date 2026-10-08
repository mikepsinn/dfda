import { z } from 'zod';

const clientTypeEnum = z.enum(['public', 'confidential']);
const optionalUrl = z.string().url().optional().or(z.literal('').transform(() => undefined));

/**
 * An OAuth client as the developer dashboard shows it. The clients are stored
 * by the Better Auth OAuth provider (lib/auth.ts); the actions map them to
 * this shape. A public client has no secret and must use PKCE.
 */
export type OAuthClientSummary = {
  client_id: string;
  client_name: string | null;
  client_uri: string | null;
  redirect_uris: string[];
  logo_uri: string | null;
  scope: string | null;
  grant_types: string[];
  response_types: string[];
  client_type: z.infer<typeof clientTypeEnum>;
  created_at: string | null;
  owner_id: string | null;
  tos_uri: string | null;
  policy_uri: string | null;
};

// Zod schema for validating the input to createOAuthClient action
export const CreateOAuthClientInputSchema = z.object({
  client_name: z.string().min(1, "Client name is required."),
  client_uri: optionalUrl,
  redirect_uris: z.array(z.string().url({ message: "Invalid redirect URI format." })).min(1, "At least one redirect URI is required."),
  logo_uri: optionalUrl,
  scope: z.string().default('openid email profile'), // Default scope
  grant_types: z.array(z.string()).default(['authorization_code', 'refresh_token']),
  response_types: z.array(z.string()).default(['code']),
  tos_uri: optionalUrl,
  policy_uri: optionalUrl,
  client_type: clientTypeEnum.default('confidential'),
});

export type CreateOAuthClientInput = z.infer<typeof CreateOAuthClientInputSchema>;

// Zod schema for updating an OAuth client. The client type cannot change.
export const UpdateOAuthClientInputSchema = CreateOAuthClientInputSchema
  .omit({ client_type: true, grant_types: true, response_types: true, scope: true })
  .extend({ scope: z.string().optional() })
  .partial()
  .extend({
    client_id: z.string(), // Ensure client_id is part of the schema and required
    client_type: clientTypeEnum.optional(), // Shown in the form; ignored on update
  });

export type UpdateOAuthClientInput = z.infer<typeof UpdateOAuthClientInputSchema>;

// Schema for the actual payload for the update action. The client type (secret
// or PKCE) is fixed when the client is created, so it is not part of it.
export const UpdateOAuthClientPayloadSchema = UpdateOAuthClientInputSchema.omit({ client_id: true, client_type: true });
export type UpdateOAuthClientPayload = z.infer<typeof UpdateOAuthClientPayloadSchema>;
