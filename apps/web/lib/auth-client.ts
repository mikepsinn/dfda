'use client'

import { createAuthClient } from 'better-auth/react'
import { magicLinkClient, organizationClient } from 'better-auth/client/plugins'
import { oauthProviderClient } from '@better-auth/oauth-provider/client'

/**
 * Better Auth in the browser. The server side is lib/auth.ts.
 *
 * oauthProviderClient adds the signed OAuth query of the current page to
 * sign-in requests, so that a sign-in during an OAuth authorization (from
 * /api/auth/oauth2/authorize) continues to the consent page.
 */
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), organizationClient(), oauthProviderClient()],
})
