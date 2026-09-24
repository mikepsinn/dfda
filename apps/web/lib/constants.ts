export const DEFAULT_SCOPES = ['openid', 'profile', 'email'];
export const DEFAULT_GRANT_TYPES = ['authorization_code', 'refresh_token'];
export const DEFAULT_RESPONSE_TYPES = ['code'];

// Maximum number of OAuth clients a user can create
export const MAX_OAUTH_CLIENTS_PER_USER = 10;

// Length of the generated client secret
export const OAUTH_CLIENT_SECRET_LENGTH = 40;

// Default expiry for authorization codes (e.g., 10 minutes in seconds)
export const AUTH_CODE_EXPIRES_IN_SECONDS = 10 * 60; 