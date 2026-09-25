import { z } from 'zod';

export const TokenRequestSchema = z.object({
  grant_type: z.literal('authorization_code', { 
    errorMap: () => ({ message: 'grant_type must be authorization_code' })
  }),
  code: z.string().min(1, 'Authorization code is required'),
  redirect_uri: z.string().url('Invalid redirect_uri format'),
  client_id: z.string().uuid('Invalid client_id format'),
  // For confidential clients, client_secret would be required.
  // For public clients using PKCE, code_verifier would be required.
  // We will need to handle this conditional logic in the route handler.
  client_secret: z.string().optional(), 
  code_verifier: z.string().optional(), // PKCE code verifier
});

export type TokenRequestInput = z.infer<typeof TokenRequestSchema>; 