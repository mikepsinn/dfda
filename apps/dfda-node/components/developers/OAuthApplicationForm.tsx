'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { DEFAULT_GRANT_TYPES, DEFAULT_RESPONSE_TYPES, DEFAULT_SCOPES } from '@/lib/constants'; // Assuming these constants exist
import { type CreateOAuthClientInput, type UpdateOAuthClientInput, CreateOAuthClientInputSchema, UpdateOAuthClientInputSchema } from '@/lib/actions/developer/oauth-clients.schemas';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// This type represents the shape of our form state
type OAuthFormState = {
  client_name: string;
  redirect_uris: string; // Comma-separated
  client_type: 'public' | 'confidential';
  client_uri: string;
  logo_uri: string;
  scope: string; // Space-separated
  grant_types: string; // Comma-separated
  response_types: string; // Comma-separated
  tos_uri: string;
  policy_uri: string;
};

// This type represents the initial data that can be passed to the form (subset of UpdateOAuthClientInput + client_id)
interface OAuthApplicationFormInitialData extends Partial<Omit<UpdateOAuthClientInput, 'client_id' | 'redirect_uris' | 'grant_types' | 'response_types' | 'scope'>> {
  client_id?: string; // Crucial for edit mode
  redirect_uris?: string[];
  grant_types?: string[];
  response_types?: string[];
  scope?: string;
}

interface OAuthApplicationFormProps {
  initialData?: OAuthApplicationFormInitialData;
  onSubmit: (data: CreateOAuthClientInput | UpdateOAuthClientInput) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  onCancel?: () => void;
  isEditMode?: boolean;
}

const OAuthApplicationForm: React.FC<OAuthApplicationFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  submitButtonText = 'Submit',
  onCancel,
  isEditMode = false,
}) => {
  const getInitialFormState = (): OAuthFormState => {
    const defaults: OAuthFormState = {
      client_name: '',
      redirect_uris: '',
      client_type: 'confidential',
      client_uri: '',
      logo_uri: '',
      scope: DEFAULT_SCOPES.join(' '),
      grant_types: DEFAULT_GRANT_TYPES.join(','),
      response_types: DEFAULT_RESPONSE_TYPES.join(','),
      tos_uri: '',
      policy_uri: '',
    };
    if (initialData) {
      return {
        client_name: initialData.client_name ?? defaults.client_name,
        redirect_uris: initialData.redirect_uris?.join(',') ?? defaults.redirect_uris,
        client_type: initialData.client_type ?? defaults.client_type,
        client_uri: initialData.client_uri ?? defaults.client_uri,
        logo_uri: initialData.logo_uri ?? defaults.logo_uri,
        scope: initialData.scope ?? defaults.scope,
        grant_types: initialData.grant_types?.join(',') ?? defaults.grant_types,
        response_types: initialData.response_types?.join(',') ?? defaults.response_types,
        tos_uri: initialData.tos_uri ?? defaults.tos_uri,
        policy_uri: initialData.policy_uri ?? defaults.policy_uri,
      };
    }
    return defaults;
  };

  const [formData, setFormData] = useState<OAuthFormState>(getInitialFormState);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(getInitialFormState());
    setErrors({}); // Clear errors when initial data changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]); // Re-run when initialData pointer changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, client_type: value as 'public' | 'confidential' }));
    if (errors.client_type) {
      setErrors(prev => ({ ...prev, client_type: [] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const baseProcessedData = {
      ...formData,
      redirect_uris: formData.redirect_uris.split(',').map(uri => uri.trim()).filter(uri => uri),
      grant_types: formData.grant_types.split(',').map(gt => gt.trim()).filter(gt => gt),
      response_types: formData.response_types.split(',').map(rt => rt.trim()).filter(rt => rt),
      client_uri: formData.client_uri || undefined,
      logo_uri: formData.logo_uri || undefined,
      tos_uri: formData.tos_uri || undefined,
      policy_uri: formData.policy_uri || undefined,
    };

    let finalData: CreateOAuthClientInput | UpdateOAuthClientInput;
    let schema;

    if (isEditMode) {
      if (!initialData?.client_id) {
        setErrors({ form: ['Client ID is missing for update.'] });
        return;
      }
      finalData = {
        ...baseProcessedData,
        client_id: initialData.client_id, // Add client_id for update
      } as UpdateOAuthClientInput; // Explicitly cast
      schema = UpdateOAuthClientInputSchema;
    } else {
      finalData = baseProcessedData as CreateOAuthClientInput; // Explicitly cast
      schema = CreateOAuthClientInputSchema;
    }

    const validation = schema.safeParse(finalData);

    if (!validation.success) {
      setErrors(validation.error.flatten().fieldErrors);
      setFormError("There was an error with the form. Please check the fields and try again.");
      return;
    }
    await onSubmit(validation.data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit OAuth Application' : 'Create New OAuth Application'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update the details of your existing OAuth application.' : 'Register a new application to use with the API.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {formError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="client_name">Application Name <span className="text-red-500">*</span></Label>
            <Input
              id="client_name"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              disabled={isLoading}
              maxLength={100}
            />
            {errors.client_name && <p className="text-sm text-red-500">{errors.client_name.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="redirect_uris">Redirect URIs (comma-separated) <span className="text-red-500">*</span></Label>
            <Textarea
              id="redirect_uris"
              name="redirect_uris"
              value={formData.redirect_uris}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g., https://myapp.com/callback,http://localhost:3000/oauth/callback"
              rows={3}
            />
            {errors.redirect_uris && <p className="text-sm text-red-500">{errors.redirect_uris.join(', ')}</p>}
            <p className="text-xs text-muted-foreground">
              After successful authorization, users will be redirected to one of these URIs.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Client Type <span className="text-red-500">*</span></Label>
            <RadioGroup
              name="client_type"
              value={formData.client_type}
              onValueChange={handleRadioChange}
              className="flex space-x-4"
              // disabled={isLoading || isEditMode} // Client type generally shouldn't change after creation
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="confidential" id="confidential" />
                <Label htmlFor="confidential">Confidential</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public">Public</Label>
              </div>
            </RadioGroup>
            {errors.client_type && <p className="text-sm text-red-500">{errors.client_type.join(', ')}</p>}
            <p className="text-xs text-muted-foreground">
              Confidential clients can securely store secrets (e.g., web servers). Public clients cannot (e.g., SPAs, mobile apps) and must use PKCE.
              {isEditMode && <span className="font-semibold"> Changing type may affect secret handling.</span>}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_uri">Application Website (Optional)</Label>
            <Input
              id="client_uri"
              name="client_uri"
              type="url"
              value={formData.client_uri} // Ensure this is a string
              onChange={handleChange}
              disabled={isLoading}
              placeholder="https://yourapp.com"
            />
            {errors.client_uri && <p className="text-sm text-red-500">{errors.client_uri.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_uri">Logo URL (Optional)</Label>
            <Input
              id="logo_uri"
              name="logo_uri"
              type="url"
              value={formData.logo_uri} // Ensure this is a string
              onChange={handleChange}
              disabled={isLoading}
              placeholder="https://yourapp.com/logo.png"
            />
            {errors.logo_uri && <p className="text-sm text-red-500">{errors.logo_uri.join(', ')}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="scope">Scopes (space-separated)</Label>
            <Input
              id="scope"
              name="scope"
              value={formData.scope}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g., openid profile email"
            />
            {errors.scope && <p className="text-sm text-red-500">{errors.scope.join(', ')}</p>}
             <p className="text-xs text-muted-foreground">
              Default: {DEFAULT_SCOPES.join(' ')}. Defines the permissions your application requests.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant_types">Grant Types (comma-separated)</Label>
            <Input
              id="grant_types"
              name="grant_types"
              value={formData.grant_types}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g., authorization_code,refresh_token"
            />
            {errors.grant_types && <p className="text-sm text-red-500">{errors.grant_types.join(', ')}</p>}
            <p className="text-xs text-muted-foreground">
              Default: {DEFAULT_GRANT_TYPES.join(',')}. Defines how your application obtains access tokens.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response_types">Response Types (comma-separated)</Label>
            <Input
              id="response_types"
              name="response_types"
              value={formData.response_types}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="e.g., code"
            />
            {errors.response_types && <p className="text-sm text-red-500">{errors.response_types.join(', ')}</p>}
            <p className="text-xs text-muted-foreground">
             Default: {DEFAULT_RESPONSE_TYPES.join(',')}. Specifies the type of response from the authorization endpoint.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tos_uri">Terms of Service URL (Optional)</Label>
            <Input
              id="tos_uri"
              name="tos_uri"
              type="url"
              value={formData.tos_uri} // Ensure this is a string
              onChange={handleChange}
              disabled={isLoading}
              placeholder="https://yourapp.com/terms"
            />
            {errors.tos_uri && <p className="text-sm text-red-500">{errors.tos_uri.join(', ')}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="policy_uri">Privacy Policy URL (Optional)</Label>
            <Input
              id="policy_uri"
              name="policy_uri"
              type="url"
              value={formData.policy_uri} // Ensure this is a string
              onChange={handleChange}
              disabled={isLoading}
              placeholder="https://yourapp.com/privacy"
            />
            {errors.policy_uri && <p className="text-sm text-red-500">{errors.policy_uri.join(', ')}</p>}
          </div>

        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : submitButtonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default OAuthApplicationForm;

