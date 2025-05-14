'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiKeyRequestForm } from "@/components/developers/ApiKeyRequestForm";
import OAuthApplicationForm from "@/components/developers/OAuthApplicationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logger } from "@/lib/logger"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeExampleTabs } from "@/components/developers/CodeExampleTabs"
import { KeyRound, Pencil, Trash2, RefreshCw, Copy } from "lucide-react"
import { type User } from '@supabase/supabase-js';
import { type Database } from '@/lib/database.types';
import { createClient } from "@/utils/supabase/client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { listOAuthClients, deleteOAuthClient, resetOAuthClientSecret, createOAuthClient, updateOAuthClient } from '@/lib/actions/developer/oauth-clients.actions';
import { CreateOAuthClientInputSchema, UpdateOAuthClientInputSchema, type CreateOAuthClientInput, type UpdateOAuthClientInput } from '@/lib/actions/developer/oauth-clients.schemas';
import { z } from 'zod';
import { updateDeveloperProfile, type UpdateProfileInput } from '@/lib/actions/developer/profile.actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { EditOAuthApplicationForm } from "@/components/developers/EditOAuthApplicationForm";

// Derive the Profile type
type Profile = Database['public']['Tables']['profiles']['Row'];

// Use Pick from the generated DB types for OAuthClient
type OAuthClient = Pick<
  Database['public']['Tables']['oauth_clients']['Row'],
  |'client_id'
  | 'client_name'
  | 'client_uri'
  | 'redirect_uris'
  | 'logo_uri'
  | 'scope'
  | 'grant_types'
  | 'response_types'
  | 'client_type'
  | 'created_at'
  | 'owner_id'
  | 'tos_uri'
  | 'policy_uri'
>;

export interface DeveloperDashboardClientProps {
  user: User | null;
  profile: Profile | null;
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
}

export function DeveloperDashboardClient({ user, profile: initialProfile, supabaseUrl, supabaseAnonKey }: DeveloperDashboardClientProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const supabase = createClient();

  const [oauthClients, setOAuthClients] = useState<OAuthClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<OAuthClient | null>(null);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error'; message: string; clientId?: string; newSecret?: string } | null>(null);

  // Profile state
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateStatus, setProfileUpdateStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [firstName, setFirstName] = useState(initialProfile?.first_name ?? '');
  const [lastName, setLastName] = useState(initialProfile?.last_name ?? '');


  const fetchOAuthClients = useCallback(async () => {
    if (!user) return;
    setIsLoadingClients(true);
    setClientsError(null);
    try {
      const result = await listOAuthClients();
      if (result.success && result.data) {
        setOAuthClients(result.data as OAuthClient[]); 
      } else {
        setClientsError(result.error || 'Failed to load OAuth clients.');
        logger.error("Failed to fetch OAuth clients", { error: result.error, details: result.details });
      }
    } catch (e: any) {
      logger.error("Error calling listOAuthClients action", { error: e });
      setClientsError('An unexpected error occurred while fetching clients.');
    }
    setIsLoadingClients(false);
  }, [user]);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        logger.error('Error getting session on client', { error });
      } else if (data.session) {
        setSessionToken(data.session.access_token);
      }
    };
    getSession();
    fetchOAuthClients();
    // Update local state if initialProfile changes (e.g. after server-side update and re-render)
    setFirstName(initialProfile?.first_name ?? '');
    setLastName(initialProfile?.last_name ?? '');
  }, [supabase, fetchOAuthClients, initialProfile]);

  const handleCreateSubmit = async (formData: z.output<typeof CreateOAuthClientInputSchema>) => {
    setActionStatus(null);
    setIsSubmittingForm(true);
    try {
      const result = await createOAuthClient(formData);
      if (result.success && result.data) {
        setActionStatus({
          type: 'success',
          message: 'OAuth Application created successfully! Please save your client secret.',
          clientId: result.data.client_id,
          newSecret: result.data.client_secret
        });
        fetchOAuthClients();
        setIsCreateFormVisible(false);
      } else {
        setActionStatus({ type: 'error', message: result.error || 'Failed to create client.' });
        logger.error('Create OAuth Client failed', { error: result.error, details: result.details });
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: 'An unexpected error occurred during client creation.' });
      logger.error('Error calling createOAuthClient action', { error: e });
    }
    setIsSubmittingForm(false);
  };

  const handleUpdateSubmit = async (formData: z.output<typeof UpdateOAuthClientInputSchema>) => {
    if (!editingClient?.client_id) {
      setActionStatus({ type: 'error', message: 'Cannot update client: Client ID is missing.' });
      setIsSubmittingForm(false);
      return;
    }
    setActionStatus(null);
    setIsSubmittingForm(true);

    try {
      const { client_id: formClientId, ...updatePayload } = formData;

      if (formClientId !== editingClient.client_id) {
        logger.error('Client ID mismatch during update attempt.', { formClientId, editingClientId: editingClient.client_id });
        setActionStatus({ type: 'error', message: 'Client ID mismatch. Please refresh and try again.' });
        setIsSubmittingForm(false);
        return;
      }
      
      const result = await updateOAuthClient(editingClient.client_id, updatePayload);

      if (result.success) {
        setActionStatus({ type: 'success', message: 'OAuth Application updated successfully.' });
        fetchOAuthClients();
        setEditingClient(null);
      } else {
        setActionStatus({ type: 'error', message: result.error || 'Failed to update client.' });
        logger.error('Update OAuth Client failed', { error: result.error, details: result.details });
      }
    } catch (e: any) {
      setActionStatus({ type: 'error', message: 'An unexpected error occurred during client update.' });
      logger.error('Error calling updateOAuthClient action', { error: e });
    }
    setIsSubmittingForm(false);
  };

  const handleEditClient = (client: OAuthClient) => {
    setActionStatus(null); 
    setIsCreateFormVisible(false);
    setEditingClient(client);
  };

  const handleCancelForm = () => {
    setIsCreateFormVisible(false);
    setEditingClient(null);
    setActionStatus(null);
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    setActionStatus(null);
    if (window.confirm(`Are you sure you want to delete the OAuth client "${clientName}"? This action cannot be undone.`)) {
      const result = await deleteOAuthClient(clientId);
      if (result.success) {
        setActionStatus({ type: 'success', message: result.message || 'Client deleted successfully.' });
        fetchOAuthClients(); 
      } else {
        setActionStatus({ type: 'error', message: result.error || 'Failed to delete client.' });
        logger.error('Failed to delete OAuth Client', { clientId, error: result.error, details: result.details });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setActionStatus(prev => ({ 
        type: 'success', 
        message: prev?.message + ' (Copied to clipboard!)' || 'Copied to clipboard!',
        clientId: prev?.clientId,
        newSecret: prev?.newSecret
      })); 
      setTimeout(() => setActionStatus(prev => {
        if (prev?.message.includes("(Copied to clipboard!)")){
            return {...prev, message: prev.message.replace(" (Copied to clipboard!)","")}
        }
        return prev;
      }), 2000);
    }).catch(err => {
      logger.error("Failed to copy to clipboard", { error: err });
      setActionStatus({ type: 'error', message: 'Failed to copy new secret.'});
    });
  };

  const handleResetClientSecret = async (clientId: string, clientName: string) => {
    setActionStatus(null);
    if (window.confirm(`Are you sure you want to reset the secret for "${clientName}"? The current secret will stop working immediately. This action cannot be undone.`)) {
      const result = await resetOAuthClientSecret(clientId);
      if (result.success && result.data?.client_secret) {
        setActionStatus({
          type: 'success',
          message: `Secret for "${clientName}" has been reset. Please save the new secret. It will not be shown again.`,
          clientId: clientId,
          newSecret: result.data.client_secret
        });
        fetchOAuthClients(); 
      } else {
        setActionStatus({ type: 'error', message: result.error || 'Failed to reset secret.' });
        logger.error('Failed to reset client secret', { clientId, error: result.error, details: result.details });
      }
    }
  };

  const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    
    setProfileUpdateStatus(null);
    setIsUpdatingProfile(true);

    const input: UpdateProfileInput = {
        first_name: firstName,
        last_name: lastName,
    };

    const result = await updateDeveloperProfile(user.id, input);

    if (result.success) {
      setProfileUpdateStatus({ type: 'success', message: 'Profile updated successfully.' });
      setTimeout(() => setProfileUpdateStatus(null), 3000);
    } else {
      setProfileUpdateStatus({ type: 'error', message: result.error || 'Failed to update profile.' });
      logger.error('Failed to update profile', { userId: user.id, error: result.error, details: result.details });
    }
    setIsUpdatingProfile(false);
  };


  // Prepare Swagger UI props
  const openApiUrl = supabaseUrl ? `${supabaseUrl}/rest/v1/` : undefined;

  const requestInterceptor = (req: any) => {
    if (sessionToken) {
      req.headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    if (supabaseAnonKey) {
        req.headers['apikey'] = supabaseAnonKey;
    }
    return req;
  };

  if (!user) {
    return <div>Loading user data or authentication required...</div>;
  }

  return (
    <div className="container py-6 md:py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Developer Dashboard</h1>
        <p className="text-muted-foreground">Manage your profile, API keys, OAuth applications, and access documentation.</p>

        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="apiExplorer">API Explorer</TabsTrigger>
            <TabsTrigger value="documentation">Documentation Links</TabsTrigger>
            <TabsTrigger value="examples">Code Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Keep your contact information up to date.</CardDescription>
              </CardHeader>
              <CardContent>
                {profileUpdateStatus && (
                    <Alert variant={profileUpdateStatus.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                        {profileUpdateStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <AlertTitle>{profileUpdateStatus.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>{profileUpdateStatus.message}</AlertDescription>
                    </Alert>
                )}
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="developer-first-name">First name</Label>
                      <Input 
                        id="developer-first-name" 
                        name="developer-first-name" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        disabled={isUpdatingProfile}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="developer-last-name">Last name</Label>
                      <Input 
                        id="developer-last-name" 
                        name="developer-last-name" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        disabled={isUpdatingProfile}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="developer-email">Email</Label>
                    <Input id="developer-email" name="developer-email" type="email" value={user.email ?? ''} readOnly />
                  </div>
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <KeyRound className="mr-2 h-5 w-5" /> API Keys
                </CardTitle>
                <CardDescription>Manage your API keys for accessing the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeyRequestForm />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <KeyRound className="mr-2 h-5 w-5" /> OAuth Applications
                </CardTitle>
                <CardDescription>Manage your OAuth applications for user authentication.</CardDescription>
              </CardHeader>
              <CardContent>
                {actionStatus && (
                  <Alert variant={actionStatus.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                    {actionStatus.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertTitle>{actionStatus.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                    <AlertDescription>
                      {actionStatus.message}
                      {actionStatus.type === 'success' && actionStatus.newSecret && actionStatus.clientId && (
                        <div className="mt-2 p-2 bg-muted rounded">
                          <p className="text-sm font-semibold">New Client Secret for ID {actionStatus.clientId}:</p>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm break-all">{actionStatus.newSecret}</span>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(actionStatus.newSecret!)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-red-600 mt-1">Save this secret. It will not be shown again.</p>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {isCreateFormVisible && (
                  <OAuthApplicationForm 
                    onSubmit={handleCreateSubmit as (data: CreateOAuthClientInput | UpdateOAuthClientInput) => Promise<void>} 
                    isLoading={isSubmittingForm}
                    submitButtonText="Create Application"
                    onCancel={handleCancelForm}
                    isEditMode={false}
                  />
                )}

                {editingClient && (
                  <OAuthApplicationForm 
                    initialData={{
                      client_id: editingClient.client_id,
                      client_name: editingClient.client_name ?? undefined,
                      client_uri: editingClient.client_uri ?? undefined,
                      logo_uri: editingClient.logo_uri ?? undefined,
                      tos_uri: editingClient.tos_uri ?? undefined,
                      policy_uri: editingClient.policy_uri ?? undefined,
                      client_type: editingClient.client_type,
                      redirect_uris: editingClient.redirect_uris ?? undefined,
                      grant_types: editingClient.grant_types ?? undefined,
                      response_types: editingClient.response_types ?? undefined,
                      scope: editingClient.scope ?? undefined,
                    }}
                    onSubmit={handleUpdateSubmit as (data: CreateOAuthClientInput | UpdateOAuthClientInput) => Promise<void>}
                    isLoading={isSubmittingForm}
                    submitButtonText="Save Changes"
                    onCancel={handleCancelForm}
                    isEditMode={true}
                  />
                )}

                {!editingClient && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-2">Your OAuth Applications:</h4>
                    {!isLoadingClients && !clientsError && oauthClients.length > 0 && (
                      <ul className="space-y-2">
                        {oauthClients.map((client) => (
                          <li key={client.client_id} className="p-3 border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="font-semibold">{client.client_name || 'Unnamed Application'}</span>
                                <span className="text-xs text-muted-foreground ml-2">(ID: {client.client_id})</span>
                              </div>
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm" onClick={() => handleEditClient(client)}>
                                  <Pencil className="h-3 w-3 mr-1 lg:mr-2" /> <span className="hidden lg:inline">Edit</span>
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleResetClientSecret(client.client_id, client.client_name || 'Unnamed Client') } className="text-blue-600 hover:text-blue-700 border-blue-600 hover:border-blue-700">
                                  <RefreshCw className="h-3 w-3 mr-1 lg:mr-2" /> <span className="hidden lg:inline">Reset Secret</span>
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteClient(client.client_id, client.client_name || 'Unnamed Client')}>
                                  <Trash2 className="h-3 w-3 mr-1 lg:mr-2" /> <span className="hidden lg:inline">Delete</span>
                                </Button>
                              </div>
                            </div>
                            {client.client_type && <p className="text-xs text-muted-foreground">Type: {client.client_type}</p>}
                            {client.redirect_uris && client.redirect_uris.length > 0 && <p className="text-xs text-muted-foreground">Redirects: {client.redirect_uris.join(', ')}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(isLoadingClients || (!clientsError && oauthClients.length === 0)) && !isLoadingClients && (
                        <p>You haven't created any OAuth applications yet.</p>
                    )}
                     {isLoadingClients && <p>Loading clients...</p>}
                     {clientsError && <p className="text-red-500">Error: {clientsError}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apiExplorer" className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle>API Explorer (Interactive)</CardTitle>
                <CardDescription>Explore and test the API endpoints directly. Requests will use your current session.</CardDescription>
              </CardHeader>
              <CardContent>
                {openApiUrl ? (
                  <SwaggerUI
                    url={openApiUrl}
                    requestInterceptor={requestInterceptor}
                    requestSnippetsEnabled={true}
                  />
                ) : (
                  <p className="text-red-500">API URL not configured. Check environment variables.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentation" className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentation Resources</CardTitle>
                <CardDescription>Links to detailed guides and API references.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">Our detailed documentation covers everything you need to know...</p>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* TODO: Populate with actual links or components */}
                   <div className="rounded-lg border p-4">
                     <h3 className="font-medium mb-2">Getting Started</h3>
                     <p className="text-sm text-muted-foreground mb-4">Learn the basics...</p>
                     <Link href="/developers/documentation#getting-started" target="_blank"><Button variant="outline" size="sm">View Section</Button></Link>
                   </div>
                   {/* ... other links ... */}
                 </div>
                 <Link href="/developers/documentation" target="_blank" rel="noopener noreferrer">
                   <Button variant="default" className="mt-4">
                     <ExternalLink className="mr-2 h-4 w-4" /> View Full Documentation
                   </Button>
                 </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
                <CardDescription>See how to integrate the API into your applications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">Explore code examples...</p>
                <CodeExampleTabs />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 