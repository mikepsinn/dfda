'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiKeyRequestForm } from "@/components/developers/ApiKeyRequestForm";
import { OAuthApplicationForm } from "@/components/developers/OAuthApplicationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { logger } from "@/lib/logger"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeExampleTabs } from "@/components/developers/CodeExampleTabs"
import { KeyRound } from "lucide-react"
// import { updateUserProfile } from "@/lib/profile" // Removed unused import
import { type User } from '@supabase/supabase-js';
import { type Database } from '@/lib/database.types';
import { createClient } from "@/utils/supabase/client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { listOAuthClients } from '@/lib/actions/developer/oauth-clients.actions'; // Import the server action
// Removed: import { type publicOauthClientsRowSchemaSchema } from '@/lib/database.schemas';
// Removed: import { z } from 'zod';
import { Pencil } from "lucide-react"; // For Edit icon
import { EditOAuthApplicationForm } from "@/components/developers/EditOAuthApplicationForm"; // Import the new form

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
  | 'created_at'
  | 'owner_id'
  | 'tos_uri'
  | 'policy_uri'
>;

// Define props for the client component
export interface DeveloperDashboardClientProps { // Export interface
  user: User | null;
  profile: Profile | null;
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
}

// Server Action needs to be defined outside or imported if used here
// For simplicity, we assume it's called from the Server Component parent
// or defined elsewhere and imported if needed directly (less common for this pattern)
// If the form submission *must* use a Server Action defined here, it needs
// careful handling or preferably restructuring to use a dedicated action file.

// For now, let's assume the profile update uses a dedicated server action defined elsewhere
// or is handled differently.
// If we keep the server action call here, it needs to be imported.
// Example: import { updateDeveloperProfileAction } from '@/lib/actions/developer'; 

// The Client Component containing the Tabs and Swagger UI
export function DeveloperDashboardClient({ user, profile, supabaseUrl, supabaseAnonKey }: DeveloperDashboardClientProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const supabase = createClient(); // Initialize client-side Supabase

  const [oauthClients, setOAuthClients] = useState<OAuthClient[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<OAuthClient | null>(null);

  const fetchOAuthClients = useCallback(async () => {
    if (!user) return;
    setIsLoadingClients(true);
    setClientsError(null);
    try {
      const result = await listOAuthClients();
      if (result.success && result.data) {
        // The data from listOAuthClients should now directly match the picked OAuthClient type
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
  }, [supabase, fetchOAuthClients]);

  const handleClientCreated = () => {
    fetchOAuthClients();
  };

  const handleEditClient = (client: OAuthClient) => {
    setEditingClient(client);
  };

  const handleUpdateCancelled = () => {
    setEditingClient(null);
  };

  const handleClientUpdated = () => {
    setEditingClient(null);
    fetchOAuthClients(); // Refresh list after update
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

  // Simplified handler assuming the server action is called elsewhere or imported
  // const handleProfileUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   if (!user) return;
  //   const formData = new FormData(event.currentTarget);
  //   await updateDeveloperProfileAction(user.id, formData); 
  // };

  if (!user) {
    return <div>Loading user data or authentication required...</div>;
  }

  return (
    // Removed <main> tag, assuming layout provides it
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
                {/* TODO: Refactor form to use a Server Action from a separate file or client-side mutation */}
                <form /* onSubmit={handleProfileUpdate} */ className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="developer-first-name">First name</Label>
                      <Input id="developer-first-name" name="developer-first-name" defaultValue={profile?.first_name ?? ''} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="developer-last-name">Last name</Label>
                      <Input id="developer-last-name" name="developer-last-name" defaultValue={profile?.last_name ?? ''} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="developer-email">Email</Label>
                    <Input id="developer-email" name="developer-email" type="email" value={user.email ?? ''} readOnly />
                  </div>
                  <Button type="submit">Update Profile (Action TBD)</Button>
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
                {editingClient ? (
                  <EditOAuthApplicationForm 
                      client={editingClient} 
                      onClientUpdated={handleClientUpdated} 
                      onCancel={handleUpdateCancelled} 
                  />
                ) : (
                  <OAuthApplicationForm onClientCreated={handleClientCreated} />
                )}

                {!editingClient && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold mb-2">Your OAuth Applications:</h4>
                    {/* ... loading/error/empty states ... */}
                    {!isLoadingClients && !clientsError && oauthClients.length > 0 && (
                      <ul className="space-y-2">
                        {oauthClients.map((client) => (
                          <li key={client.client_id} className="p-3 border rounded-md flex justify-between items-center">
                            <div>
                              <span className="font-semibold">{client.client_name}</span>
                              <span className="text-xs text-muted-foreground ml-2">(ID: {client.client_id})</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => handleEditClient(client)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </Button>
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