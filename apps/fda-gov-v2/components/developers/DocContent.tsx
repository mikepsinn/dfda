"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, ExternalLink } from "lucide-react"
import { CodeBlock } from "./CodeBlock"

export function DocContent() {
  const contentRef = useRef<HTMLDivElement>(null)

  // Add a useLayoutEffect to stabilize layout before ResizeObserver runs
  useEffect(() => {
    // Force a stable layout by ensuring content has a fixed width initially
    if (contentRef.current) {
      const contentElement = contentRef.current;
      const originalWidth = contentElement.style.width
      contentElement.style.width = `${contentElement.offsetWidth}px`

      // After a short delay, restore original width to allow natural resizing
      const timer = setTimeout(() => {
        if (contentElement) {
          contentElement.style.width = originalWidth
        }
      }, 100)

      return () => {
        clearTimeout(timer)
        if (contentElement) {
          contentElement.style.width = originalWidth
        }
      }
    }
  }, [])

  // Replace the existing cleanup useEffect with:
  useEffect(() => {
    return () => {
      // Force any ResizeObservers to disconnect by ensuring the element
      // has a stable size when unmounting
      if (contentRef.current) {
        const contentElement = contentRef.current;
        contentElement.style.height = "auto"
        contentElement.style.width = "auto"
      }
    }
  }, [])

  return (
    <div className="max-w-3xl" ref={contentRef}>
      <section id="introduction" className="mb-10">
        <h2 className="text-3xl font-bold mb-4">Introduction</h2>
        <p className="text-muted-foreground mb-4">
          The FDA.gov v2 API provides programmatic access to clinical trial data, comparative effectiveness information,
          and outcome labels. This documentation will help you integrate with our API and build powerful healthcare
          applications.
        </p>
        <div className="rounded-lg bg-primary/5 p-4 mb-6">
          <h3 className="font-medium mb-2">Base URL</h3>
          <div className="flex items-center justify-between bg-muted rounded p-2">
            <code className="text-sm">https://api.fdav2.gov/v1</code>
            <Button variant="ghost" size="sm">
              <Copy className="h-4 w-4" />
              <span className="sr-only">Copy</span>
            </Button>
          </div>
        </div>
        <p className="mb-4">
          All API requests should be made to the base URL above. The API is organized around REST principles and returns
          JSON-encoded responses.
        </p>
      </section>

      <section id="authentication" className="mb-10">
        <h2 className="text-3xl font-bold mb-4">Authentication</h2>
        <p className="text-muted-foreground mb-4">
          The FDA.gov v2 API supports two authentication methods: API keys for accessing public data and OAuth 2.0 for
          accessing user-specific data.
        </p>

        <div className="space-y-6">
          <div id="api-keys">
            <h3 className="text-xl font-bold mb-2">API Keys</h3>
            <p className="mb-4">
              API keys are used to access public data like clinical trials, outcome labels, and comparative
              effectiveness data. Include your API key in the Authorization header of all your requests.
            </p>
            <CodeBlock title="API Key Authentication">
              {`// Include in all API requests
const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
};

fetch('https://api.fdav2.gov/v1/trials', { headers })
  .then(response => response.json())
  .then(data => console.log(data));`}
            </CodeBlock>
          </div>

          <div id="oauth2">
            <h3 className="text-xl font-bold mb-2">OAuth 2.0</h3>
            <p className="mb-4">
              OAuth 2.0 is used to access user-specific data and perform actions on behalf of users. This is required
              for endpoints that access or modify user data.
            </p>

            <h4 className="text-lg font-medium mb-2">OAuth 2.0 Flow</h4>
            <ol className="list-decimal list-inside space-y-2 mb-4">
              <li>Redirect the user to our authorization URL</li>
              <li>User authenticates and grants permission to your application</li>
              <li>User is redirected back to your application with an authorization code</li>
              <li>Exchange the authorization code for an access token</li>
              <li>Use the access token to make API requests on behalf of the user</li>
            </ol>

            <div className="space-y-4">
              <CodeBlock title="1. Redirect to Authorization URL">
                {`const CLIENT_ID = 'your_client_id';
const REDIRECT_URI = 'https://your-app.com/callback';
const SCOPES = 'user:read user.trials:read';

function redirectToAuth() {
  const authUrl = new URL('https://api.fdav2.gov/oauth/authorize');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPES);

  window.location.href = authUrl.toString();
}`}
              </CodeBlock>

              <CodeBlock title="2. Exchange Code for Token">
                {`// After receiving the code in your redirect URI
async function exchangeCodeForToken(code) {
  const response = await fetch('https://api.fdav2.gov/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: 'YOUR_CLIENT_SECRET'
    })
  });

  const data = await response.json();
  // Store tokens securely
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  
  return data;
}`}
              </CodeBlock>

              <CodeBlock title="3. Use Access Token">
                {`// Include in API requests that require user authentication
const accessToken = localStorage.getItem('access_token');

const headers = {
  'Authorization': \`Bearer \${accessToken}\`,
  'Content-Type': 'application/json'
};

fetch('https://api.fdav2.gov/v1/user/profile', { headers })
  .then(response => response.json())
  .then(data => console.log(data));`}
              </CodeBlock>
            </div>
          </div>

          <div id="scopes">
            <h3 className="text-xl font-bold mb-2">OAuth 2.0 Scopes</h3>
            <p className="mb-4">
              Scopes define the specific access permissions your application is requesting. Always request the minimum
              scopes necessary for your application.
            </p>
            <Card className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Scope</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-sm">trials:read</td>
                    <td className="py-2">Read public trial data</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-sm">user:read</td>
                    <td className="py-2">Read basic user profile information</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-sm">user.trials:read</td>
                    <td className="py-2">Read user's trial participation data</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-sm">user.trials:write</td>
                    <td className="py-2">Enroll user in trials and update participation status</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-mono text-sm">user.data:read</td>
                    <td className="py-2">Read user's health data and trial submissions</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono text-sm">user.data:write</td>
                    <td className="py-2">Submit data on behalf of the user</td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </section>

      <section id="endpoints" className="mb-10">
        <h2 className="text-3xl font-bold mb-4">API Endpoints</h2>
        <p className="text-muted-foreground mb-4">
          The FDA.gov v2 API provides several endpoints for accessing different types of data. Below is a comprehensive
          reference for all available endpoints.
        </p>

        <div id="trials-endpoints" className="mb-8">
          <h3 className="text-xl font-bold mb-4">Clinical Trials Endpoints</h3>

          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                <code className="text-sm font-mono">/trials</code>
              </div>
              <p className="text-sm mb-4">Get a list of clinical trials with optional filtering.</p>

              <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 text-sm">Parameter</th>
                    <th className="text-left py-1 text-sm">Type</th>
                    <th className="text-left py-1 text-sm">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="py-1">condition</td>
                    <td className="py-1">string</td>
                    <td className="py-1">Filter by medical condition</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1">status</td>
                    <td className="py-1">string</td>
                    <td className="py-1">Filter by trial status (recruiting, completed, etc.)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1">limit</td>
                    <td className="py-1">integer</td>
                    <td className="py-1">Number of results to return (default: 20, max: 100)</td>
                  </tr>
                  <tr>
                    <td className="py-1">offset</td>
                    <td className="py-1">integer</td>
                    <td className="py-1">Number of results to skip (default: 0)</td>
                  </tr>
                </tbody>
              </table>

              <Tabs defaultValue="request">
                <TabsList className="w-full">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>
                <TabsContent value="request" className="mt-2">
                  <CodeBlock title="Example Request">
                    {`curl -X GET "https://api.fdav2.gov/v1/trials?condition=diabetes&limit=2" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                  </CodeBlock>
                </TabsContent>
                <TabsContent value="response" className="mt-2">
                  <CodeBlock title="Example Response">
                    {`{
  "data": [
    {
      "id": "trial-123",
      "name": "Efficacy of Treatment A for Type 2 Diabetes",
      "sponsor": "Innovative Therapeutics Inc.",
      "phase": "Phase 2",
      "status": "Recruiting",
      "condition": "Type 2 Diabetes",
      "intervention": "Treatment A",
      "description": "This trial evaluates the efficacy and safety of Treatment A in adults with type 2 diabetes.",
      "eligibility": {
        "min_age": 18,
        "max_age": 75,
        "criteria": "Diagnosed with type 2 diabetes for at least 6 months"
      },
      "location": "Decentralized (Remote)",
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-02-01T09:30:00Z"
    },
    {
      "id": "trial-456",
      "name": "Comparative Study of Treatments B and C for Type 2 Diabetes",
      "sponsor": "DiabetesCare Research",
      "phase": "Phase 3",
      "status": "Recruiting",
      "condition": "Type 2 Diabetes",
      "intervention": "Treatment B, Treatment C",
      "description": "This trial compares the efficacy of Treatments B and C in adults with type 2 diabetes.",
      "eligibility": {
        "min_age": 21,
        "max_age": 70,
        "criteria": "Diagnosed with type 2 diabetes with HbA1c between 7.0% and 10.0%"
      },
      "location": "Decentralized (Remote)",
      "created_at": "2025-01-20T14:30:00Z",
      "updated_at": "2025-02-05T11:15:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "limit": 2,
    "offset": 0
  }
}`}
                  </CodeBlock>
                </TabsContent>
              </Tabs>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                <code className="text-sm font-mono">/trials/{"{id}"}</code>
              </div>
              <p className="text-sm mb-4">Get detailed information about a specific clinical trial.</p>

              <h4 className="text-sm font-medium mb-2">Path Parameters</h4>
              <table className="w-full mb-4">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 text-sm">Parameter</th>
                    <th className="text-left py-1 text-sm">Type</th>
                    <th className="text-left py-1 text-sm">Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="py-1">id</td>
                    <td className="py-1">string</td>
                    <td className="py-1">Trial ID</td>
                  </tr>
                </tbody>
              </table>

              <Tabs defaultValue="request">
                <TabsList className="w-full">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>
                <TabsContent value="request" className="mt-2">
                  <CodeBlock title="Example Request">
                    {`curl -X GET "https://api.fdav2.gov/v1/trials/trial-123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                  </CodeBlock>
                </TabsContent>
                <TabsContent value="response" className="mt-2">
                  <CodeBlock title="Example Response">
                    {`{
  "data": {
    "id": "trial-123",
    "name": "Efficacy of Treatment A for Type 2 Diabetes",
    "sponsor": "Innovative Therapeutics Inc.",
    "phase": "Phase 2",
    "status": "Recruiting",
    "condition": "Type 2 Diabetes",
    "intervention": "Treatment A",
    "description": "This trial evaluates the efficacy and safety of Treatment A in adults with type 2 diabetes.",
    "eligibility": {
      "min_age": 18,
      "max_age": 75,
      "criteria": "Diagnosed with type 2 diabetes for at least 6 months",
      "exclusion_criteria": [
        "Participation in other clinical trials within the past 30 days",
        "History of severe hypoglycemia",
        "Pregnancy or breastfeeding"
      ]
    },
    "location": "Decentralized (Remote)",
    "duration": "12 weeks",
    "participants": {
      "target": 500,
      "enrolled": 342
    },
    "requirements": [
      "Complete baseline questionnaires and lab tests",
      "Take study medication as directed",
      "Complete weekly symptom tracking",
      "Participate in virtual check-ins at weeks 4, 8, and 12"
    ],
    "compensation": {
      "price": 0,
      "deposit": 100,
      "refund_schedule": [
        { "milestone": "4-week follow-up", "amount": 25 },
        { "milestone": "8-week follow-up", "amount": 25 },
        { "milestone": "12-week completion", "amount": 50 }
      ]
    },
    "created_at": "2025-01-15T12:00:00Z",
    "updated_at": "2025-02-01T09:30:00Z"
  }
}`}
                  </CodeBlock>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        <div id="user-endpoints" className="mb-8">
          <h3 className="text-xl font-bold mb-4">User Data Endpoints</h3>
          <p className="text-sm text-muted-foreground mb-4">
            These endpoints require OAuth 2.0 authentication with appropriate scopes.
          </p>

          <div className="space-y-6">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                <code className="text-sm font-mono">/user/profile</code>
              </div>
              <p className="text-sm mb-2">Get the authenticated user's profile information.</p>
              <p className="text-xs text-muted-foreground mb-4">
                Required scope: <code>user:read</code>
              </p>

              <Tabs defaultValue="request">
                <TabsList className="w-full">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>
                <TabsContent value="request" className="mt-2">
                  <CodeBlock title="Example Request">
                    {`curl -X GET "https://api.fdav2.gov/v1/user/profile" \\
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`}
                  </CodeBlock>
                </TabsContent>
                <TabsContent value="response" className="mt-2">
                  <CodeBlock title="Example Response">
                    {`{
  "data": {
    "id": "user-789",
    "first_name": "Alex",
    "last_name": "Johnson",
    "email": "alex.johnson@example.com",
    "created_at": "2024-12-10T15:30:00Z",
    "updated_at": "2025-01-05T09:45:00Z"
  }
}`}
                  </CodeBlock>
                </TabsContent>
              </Tabs>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">GET</span>
                <code className="text-sm font-mono">/user/trials</code>
              </div>
              <p className="text-sm mb-2">Get the authenticated user's trial participation.</p>
              <p className="text-xs text-muted-foreground mb-4">
                Required scope: <code>user.trials:read</code>
              </p>

              <Tabs defaultValue="request">
                <TabsList className="w-full">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>
                <TabsContent value="request" className="mt-2">
                  <CodeBlock title="Example Request">
                    {`curl -X GET "https://api.fdav2.gov/v1/user/trials" \\
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \\
  -H "Content-Type: application/json"`}
                  </CodeBlock>
                </TabsContent>
                <TabsContent value="response" className="mt-2">
                  <CodeBlock title="Example Response">
                    {`{
  "data": [
    {
      "trial_id": "trial-123",
      "name": "Efficacy of Treatment A for Type 2 Diabetes",
      "status": "active",
      "enrolled_at": "2025-02-15T10:30:00Z",
      "progress": 33,
      "next_milestone": "4-week follow-up",
      "due_date": "2025-03-15T00:00:00Z",
      "refund_amount": 25
    }
  ],
  "meta": {
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}`}
                  </CodeBlock>
                </TabsContent>
              </Tabs>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">POST</span>
                <code className="text-sm font-mono">/user/trials/{"{trial_id}"}/enroll</code>
              </div>
              <p className="text-sm mb-2">Enroll the authenticated user in a specific trial.</p>
              <p className="text-xs text-muted-foreground mb-4">
                Required scope: <code>user.trials:write</code>
              </p>

              <Tabs defaultValue="request">
                <TabsList className="w-full">
                  <TabsTrigger value="request">Request</TabsTrigger>
                  <TabsTrigger value="response">Response</TabsTrigger>
                </TabsList>
                <TabsContent value="request" className="mt-2">
                  <CodeBlock title="Example Request">
                    {`curl -X POST "https://api.fdav2.gov/v1/user/trials/trial-456/enroll" \\
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "consent": true,
    "deposit_payment": {
      "payment_method_id": "pm_123456789"
    }
  }'`}
                  </CodeBlock>
                </TabsContent>
                <TabsContent value="response" className="mt-2">
                  <CodeBlock title="Example Response">
                    {`{
  "data": {
    "trial_id": "trial-456",
    "name": "Comparative Study of Treatments B and C for Type 2 Diabetes",
    "status": "active",
    "enrolled_at": "2025-03-04T23:12:57Z",
    "next_milestone": "baseline-assessment",
    "due_date": "2025-03-11T23:12:57Z"
  }
}`}
                  </CodeBlock>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      <section id="error-handling" className="mb-10">
        <h2 className="text-3xl font-bold mb-4">Error Handling</h2>
        <p className="text-muted-foreground mb-4">
          The FDA.gov v2 API uses conventional HTTP response codes to indicate the success or failure of an API request.
          Here's how to handle errors in your applications.
        </p>

        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">HTTP Status Codes</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Code</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-mono">200 - OK</td>
                  <td className="py-2">The request was successful.</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">400 - Bad Request</td>
                  <td className="py-2">
                    The request was invalid or cannot be served. The exact error is explained in the response body.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">401 - Unauthorized</td>
                  <td className="py-2">Authentication credentials were missing or incorrect.</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">403 - Forbidden</td>
                  <td className="py-2">
                    The authenticated user does not have permission to access the requested resource.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">404 - Not Found</td>
                  <td className="py-2">The requested resource does not exist.</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">429 - Too Many Requests</td>
                  <td className="py-2">The rate limit has been exceeded. See the Rate Limiting section for details.</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono">500, 502, 503, 504 - Server Errors</td>
                  <td className="py-2">Something went wrong on our end. Please try again later.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">Error Response Format</h3>
            <p className="mb-4">
              When an error occurs, the API returns a JSON object with an error field containing details about the
              error.
            </p>
            <CodeBlock title="Example Error Response">
              {`{
  "error": {
    "code": "invalid_request",
    "message": "The 'condition' parameter is required",
    "status": 400,
    "documentation_url": "https://api.fdav2.gov/docs/errors#invalid_request"
  }
}`}
            </CodeBlock>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">Common Error Codes</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Error Code</th>
                  <th className="text-left py-2">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-mono">invalid_request</td>
                  <td className="py-2">The request was malformed or missing required parameters.</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">invalid_auth</td>
                  <td className="py-2">Authentication failed due to invalid credentials.</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">insufficient_scope</td>
                  <td className="py-2">
                    The access token does not have the required scope for the requested operation.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-mono">rate_limit_exceeded</td>
                  <td className="py-2">The rate limit for the API has been exceeded.</td>
                </tr>
                <tr>
                  <td className="py-2 font-mono">server_error</td>
                  <td className="py-2">An error occurred on the server. Please try again later.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="rate-limiting" className="mb-10">
        <h2 className="text-3xl font-bold mb-4">Rate Limiting</h2>
        <p className="text-muted-foreground mb-4">
          To ensure the stability and availability of the API for all users, the FDA.gov v2 API implements rate
          limiting. The rate limits vary based on your plan.
        </p>

        <div className="rounded-lg border p-4 mb-6">
          <h3 className="text-lg font-medium mb-2">Rate Limits by Plan</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Plan</th>
                <th className="text-left py-2">Rate Limit</th>
                <th className="text-left py-2">Burst Limit</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Free</td>
                <td className="py-2">100 requests/hour</td>
                <td className="py-2">20 requests/minute</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Basic</td>
                <td className="py-2">1,000 requests/hour</td>
                <td className="py-2">100 requests/minute</td>
              </tr>
              <tr>
                <td className="py-2">Enterprise</td>
                <td className="py-2">10,000 requests/hour</td>
                <td className="py-2">1,000 requests/minute</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-medium mb-2">Rate Limit Headers</h3>
          <p className="mb-4">The API includes rate limit information in the response headers:</p>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Header</th>
                <th className="text-left py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-mono">X-RateLimit-Limit</td>
                <td className="py-2">The maximum number of requests you're permitted to make per hour.</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono">X-RateLimit-Remaining</td>
                <td className="py-2">The number of requests remaining in the current rate limit window.</td>
              </tr>
              <tr>
                <td className="py-2 font-mono">X-RateLimit-Reset</td>
                <td className="py-2">The time at which the current rate limit window resets in UTC epoch seconds.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="sdks" className="mb-10">
        <h2 className="text-3xl font-bold mb-4">SDKs & Client Libraries</h2>
        <p className="text-muted-foreground mb-4">
          To make integration easier, we provide official SDKs for popular programming languages. These SDKs handle
          authentication, error handling, and provide a more convenient interface for working with the API.
        </p>

        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">JavaScript SDK</h3>
            <p className="text-sm text-muted-foreground mb-4">For Node.js and browser applications</p>
            <CodeBlock title="Installation">
              {`npm install @fdav2/sdk

# or with yarn
yarn add @fdav2/sdk`}
            </CodeBlock>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> View on GitHub
            </Button>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">Python SDK</h3>
            <p className="text-sm text-muted-foreground mb-4">For Python applications</p>
            <CodeBlock title="Installation">
              {`pip install fdav2-sdk

# or with poetry
poetry add fdav2-sdk`}
            </CodeBlock>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> View on GitHub
            </Button>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">Ruby SDK</h3>
            <p className="text-sm text-muted-foreground mb-4">For Ruby applications</p>
            <CodeBlock title="Installation">
              {`gem install fdav2-sdk

# or in your Gemfile
gem 'fdav2-sdk'`}
            </CodeBlock>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> View on GitHub
            </Button>
          </div>
        </div>

        <div id="javascript-sdk" className="rounded-lg border p-4 mb-6">
          <h3 className="text-lg font-medium mb-2">JavaScript SDK Example</h3>
          <CodeBlock title="Basic Usage">
            {`import { FDAv2Client } from '@fdav2/sdk';

// Initialize with API key for public data
const client = new FDAv2Client({
  apiKey: 'YOUR_API_KEY'
});

// Get clinical trials
async function getTrials() {
  try {
    const trials = await client.trials.list({
      condition: 'diabetes',
      limit: 10
    });
    console.log(trials);
  } catch (error) {
    console.error('Error fetching trials:', error);
  }
}

// Initialize with OAuth for user data
const oauthClient = new FDAv2Client({
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET',
  redirectUri: 'https://your-app.com/callback'
});

// Generate authorization URL
const authUrl = oauthClient.auth.getAuthorizationUrl({
  scopes: ['user:read', 'user.trials:read']
});

// Exchange code for token
async function handleCallback(code) {
  try {
    const tokens = await oauthClient.auth.getToken(code);
    // Store tokens securely
    localStorage.setItem('access_token', tokens.access_token);
    
    // Use the token
    const userClient = new FDAv2Client({
      accessToken: tokens.access_token
    });
    
    const profile = await userClient.user.getProfile();
    console.log(profile);
  } catch (error) {
    console.error('Error:', error);
  }
}`}
          </CodeBlock>
        </div>
      </section>

      <section id="support" className="mb-10">
        <h2 className="text-3xl font-bold mb-4">Support & Resources</h2>
        <p className="text-muted-foreground mb-4">
          Need help with the FDA.gov v2 API? Here are some resources to help you get started and resolve any issues you
          may encounter.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">Developer Community</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join our developer community to ask questions, share solutions, and connect with other developers.
            </p>
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> Join Community Forum
            </Button>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">GitHub Issues</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Report bugs, request features, or contribute to our open-source SDKs on GitHub.
            </p>
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> View GitHub Repository
            </Button>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contact our developer support team for assistance with integration issues.
            </p>
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> Contact Support
            </Button>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium mb-2">API Status</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Check the current status of the API and view any ongoing incidents.
            </p>
            <Button variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> View API Status
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
