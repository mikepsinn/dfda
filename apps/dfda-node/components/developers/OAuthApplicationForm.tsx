'use client';

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logger } from "@/lib/logger";
import { createOAuthClient, type CreateOAuthClientInput } from '@/lib/actions/developer/oauth-clients.actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Copy } from "lucide-react";

interface OAuthApplicationFormProps {
  onClientCreated: () => void; // Callback to refresh client list in parent
}

export function OAuthApplicationForm({ onClientCreated }: OAuthApplicationFormProps) {
  const [clientName, setClientName] = useState('');
  const [clientUri, setClientUri] = useState('');
  const [redirectUris, setRedirectUris] = useState(''); // Comma-separated for now
  const [logoUri, setLogoUri] = useState('');
  const [scope, setScope] = useState('openid email profile'); // Default scope
  const [tosUri, setTosUri] = useState('');
  const [policyUri, setPolicyUri] = useState('');
  // const [appDescription, setAppDescription] = useState(''); // If you want to keep description

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newClientDetails, setNewClientDetails] = useState<{ clientId: string; clientSecret: string } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setNewClientDetails(null);

    const redirectUrisArray = redirectUris.split(',').map(uri => uri.trim()).filter(uri => uri.length > 0);
    if (redirectUrisArray.length === 0) {
        setError("At least one Redirect URI is required.");
        setIsLoading(false);
        return;
    }

    const input: CreateOAuthClientInput = {
      client_name: clientName,
      redirect_uris: redirectUrisArray,
      client_uri: clientUri || undefined,
      logo_uri: logoUri || undefined,
      scope: scope.trim() === '' ? 'openid email profile' : scope.trim(),
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      tos_uri: tosUri || undefined,
      policy_uri: policyUri || undefined,
    };

    try {
      const result = await createOAuthClient(input);
      if (result.success && result.data) {
        setSuccessMessage('OAuth Application created successfully!');
        setNewClientDetails({ clientId: result.data.client_id, clientSecret: result.data.client_secret! });
        // Reset form fields
        setClientName('');
        setClientUri('');
        setRedirectUris('');
        setLogoUri('');
        setScope('openid email profile');
        setTosUri('');
        setPolicyUri('');
        onClientCreated(); // Notify parent to refresh list
      } else {
        logger.error('Failed to create OAuth client', { error: result.error, details: result.details });
        setError(result.error || 'An unknown error occurred.');
        if (result.details) {
            const messages = Object.values(result.details._errors || {}).flat().join(', ') || 'Invalid input.';
            setError(`Creation failed: ${messages}`);
        }
      }
    } catch (e: any) {
      logger.error('Error submitting OAuth application form', { error: e });
      setError('An unexpected error occurred. Please try again.');
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Maybe show a small temporary message "Copied!"
      logger.info("Copied to clipboard");
    }).catch(err => {
      logger.error("Failed to copy to clipboard", { error: err });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New OAuth Application</CardTitle>
        <CardDescription>Register a new application to use OAuth 2.0 for authentication.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">Application Name *</Label>
            <Input id="app-name" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="redirect-uris">Redirect URIs *</Label>
            <Input 
              id="redirect-uris" 
              placeholder="e.g., https://app.com/callback, http://localhost:3000/auth/callback" 
              value={redirectUris} 
              onChange={(e) => setRedirectUris(e.target.value)} 
              required 
            />
            <p className="text-xs text-muted-foreground">Comma-separated if multiple.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-website">Application Website URL</Label>
            <Input id="app-website" placeholder="https://your-app.com" value={clientUri} onChange={(e) => setClientUri(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-logo">Logo URL</Label>
            <Input id="app-logo" placeholder="https://your-app.com/logo.png" value={logoUri} onChange={(e) => setLogoUri(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-scope">Scopes</Label>
            <Input id="app-scope" placeholder="openid email profile" value={scope} onChange={(e) => setScope(e.target.value)} />
            <p className="text-xs text-muted-foreground">Space-separated. Defaults to 'openid email profile'.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-tos">Terms of Service URL</Label>
            <Input id="app-tos" placeholder="https://your-app.com/terms" value={tosUri} onChange={(e) => setTosUri(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-policy">Privacy Policy URL</Label>
            <Input id="app-policy" placeholder="https://your-app.com/privacy" value={policyUri} onChange={(e) => setPolicyUri(e.target.value)} />
          </div>

          {/* If you want to keep application description, uncomment and manage its state
          <div className="space-y-2">
            <Label htmlFor="app-description">Application Description (Optional)</Label>
            <Textarea id="app-description" className="min-h-[80px]" value={appDescription} onChange={(e) => setAppDescription(e.target.value)} />
          </div>
          */}
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register OAuth Application'}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && newClientDetails && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                {successMessage}<br />
                <strong>Client ID:</strong> {newClientDetails.clientId}
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newClientDetails.clientId)} className="ml-2">
                    <Copy className="h-3 w-3 mr-1" /> Copy
                </Button><br />
                <strong>Client Secret:</strong> <span className="font-mono bg-muted p-1 rounded">{newClientDetails.clientSecret}</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(newClientDetails.clientSecret)} className="ml-2">
                    <Copy className="h-3 w-3 mr-1" /> Copy
                </Button><br />
                <span className="text-red-600 font-semibold">Please save your client secret. You will not be able to see it again.</span>
              </AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

