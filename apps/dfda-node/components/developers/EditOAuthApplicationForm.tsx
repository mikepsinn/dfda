'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logger } from "@/lib/logger";
import { updateOAuthClient, type UpdateOAuthClientInput } from '@/lib/actions/developer/oauth-clients.actions';
import { type Database } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";

// Re-define or import OAuthClient type if not globally available
// For consistency with DeveloperDashboardClient, let's use the Pick approach
type OAuthClient = Pick<
  Database['public']['Tables']['oauth_clients']['Row'],
  'client_id' | 'client_name' | 'client_uri' | 'redirect_uris' | 'logo_uri' | 'scope' | 'grant_types' | 'response_types' | 'created_at' | 'owner_id' | 'tos_uri' | 'policy_uri'
>;

interface EditOAuthApplicationFormProps {
  client: OAuthClient;
  onClientUpdated: () => void;
  onCancel: () => void;
}

export function EditOAuthApplicationForm({ client, onClientUpdated, onCancel }: EditOAuthApplicationFormProps) {
  const [clientName, setClientName] = useState(client.client_name || '');
  const [clientUri, setClientUri] = useState(client.client_uri || '');
  const [redirectUris, setRedirectUris] = useState(client.redirect_uris.join(', ') || '');
  const [logoUri, setLogoUri] = useState(client.logo_uri || '');
  const [scope, setScope] = useState(client.scope || 'openid email profile');
  const [tosUri, setTosUri] = useState(client.tos_uri || '');
  const [policyUri, setPolicyUri] = useState(client.policy_uri || '');
  // Grant types and response types are usually not directly editable by users in this manner
  // They are part of the client's capabilities defined during creation or by policy.
  // If they need to be editable, the form and schema would need to reflect that.

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Populate form when client prop changes (though typically it won't change during edit lifecycle)
  useEffect(() => {
    setClientName(client.client_name || '');
    setClientUri(client.client_uri || '');
    setRedirectUris(client.redirect_uris.join(', ') || '');
    setLogoUri(client.logo_uri || '');
    setScope(client.scope || 'openid email profile');
    setTosUri(client.tos_uri || '');
    setPolicyUri(client.policy_uri || '');
  }, [client]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const redirectUrisArray = redirectUris.split(',').map(uri => uri.trim()).filter(uri => uri.length > 0);
    if (redirectUrisArray.length === 0) {
        setError("At least one Redirect URI is required.");
        setIsLoading(false);
        return;
    }
    
    const updatedFields: UpdateOAuthClientInput = {};
    // Only add fields to the update if they have changed from the original client data,
    // or if they are non-empty. The UpdateOAuthClientInputSchema is partial.

    if (clientName !== (client.client_name || '')) updatedFields.client_name = clientName;
    if (clientUri !== (client.client_uri || '')) updatedFields.client_uri = clientUri;
    if (redirectUrisArray.join(', ') !== client.redirect_uris.join(', ')) updatedFields.redirect_uris = redirectUrisArray;
    if (logoUri !== (client.logo_uri || '')) updatedFields.logo_uri = logoUri;
    if (scope !== (client.scope || 'openid email profile')) updatedFields.scope = scope.trim() === '' ? 'openid email profile' : scope.trim();
    if (tosUri !== (client.tos_uri || '')) updatedFields.tos_uri = tosUri;
    if (policyUri !== (client.policy_uri || '')) updatedFields.policy_uri = policyUri;

    // Grant types and response types are not typically changed in an edit form like this
    // If they were, they'd need to be added here as well, e.g.:
    // updatedFields.grant_types = selectedGrantTypes;
    // updatedFields.response_types = selectedResponseTypes;

    if (Object.keys(updatedFields).length === 0) {
      setSuccessMessage("No changes detected.");
      setIsLoading(false);
      // Optionally call onCancel or onClientUpdated if you want to close the form
      // onClientUpdated(); // or onCancel(); 
      return;
    }

    try {
      const result = await updateOAuthClient(client.client_id, updatedFields);
      if (result.success && result.data) {
        setSuccessMessage('OAuth Application updated successfully!');
        // No new secret to show on update
        onClientUpdated(); // Notify parent to refresh list and close form
      } else {
        logger.error('Failed to update OAuth client', { error: result.error, details: result.details });
        setError(result.error || 'An unknown error occurred.');
        if (result.details && result.details.fieldErrors) {
            const messages = Object.values(result.details.fieldErrors).flat().join(', ') || 'Invalid input.';
            setError(`Update failed: ${messages}`);
        } else if (result.details) {
            const messages = Object.values(result.details._errors || {}).flat().join(', ') || 'Invalid input.';
            setError(`Update failed: ${messages}`);
        }
      }
    } catch (e: any) {
      logger.error('Error submitting OAuth application update form', { error: e });
      setError('An unexpected error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit: {client.client_name}</CardTitle>
        <CardDescription>Update your OAuth application details.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-app-name">Application Name *</Label>
            <Input id="edit-app-name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-redirect-uris">Redirect URIs *</Label>
            <Input 
              id="edit-redirect-uris" 
              placeholder="e.g., https://app.com/callback, http://localhost:3000/auth/callback" 
              value={redirectUris} 
              onChange={(e) => setRedirectUris(e.target.value)} 
              required 
            />
            <p className="text-xs text-muted-foreground">Comma-separated if multiple.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-app-website">Application Website URL</Label>
            <Input id="edit-app-website" placeholder="https://your-app.com" value={clientUri} onChange={(e) => setClientUri(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-app-logo">Logo URL</Label>
            <Input id="edit-app-logo" placeholder="https://your-app.com/logo.png" value={logoUri} onChange={(e) => setLogoUri(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-app-scope">Scopes</Label>
            <Input id="edit-app-scope" placeholder="openid email profile" value={scope} onChange={(e) => setScope(e.target.value)} />
            <p className="text-xs text-muted-foreground">Space-separated. Defaults to 'openid email profile'.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-app-tos">Terms of Service URL</Label>
            <Input id="edit-app-tos" placeholder="https://your-app.com/terms" value={tosUri} onChange={(e) => setTosUri(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-app-policy">Privacy Policy URL</Label>
            <Input id="edit-app-policy" placeholder="https://your-app.com/privacy" value={policyUri} onChange={(e) => setPolicyUri(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          <div className="flex space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert className="mt-4"> {/* Default variant for success */}
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </form>
    </Card>
  );
} 