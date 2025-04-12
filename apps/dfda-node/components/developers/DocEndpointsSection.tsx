import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeBlock } from "./CodeBlock"

export function DocEndpointsSection() {
  return (
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
                  {`curl -X GET "https://api.dfda.earth/v1/trials?condition=diabetes&limit=2" \
  -H "Authorization: Bearer YOUR_API_KEY" \
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
      "research-partner": "Innovative Therapeutics Inc.",
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
      "research-partner": "DiabetesCare Research",
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
              <code className="text-sm font-mono">/trials/{"{"}id{"}"}</code>
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
                  {`curl -X GET "https://api.dfda.earth/v1/trials/trial-123" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"`}
                </CodeBlock>
              </TabsContent>
              <TabsContent value="response" className="mt-2">
                <CodeBlock title="Example Response">
                  {`{
  "data": {
    "id": "trial-123",
    "name": "Efficacy of Treatment A for Type 2 Diabetes",
    "research-partner": "Innovative Therapeutics Inc.",
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
                  {`curl -X GET "https://api.dfda.earth/v1/user/profile" \
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \
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
                  {`curl -X GET "https://api.dfda.earth/v1/user/trials" \
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \
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
              <code className="text-sm font-mono">/user/trials/{"{"}trial_id{"}"}/enroll</code>
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
                  {`curl -X POST "https://api.dfda.earth/v1/user/trials/trial-456/enroll" \
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
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
  )
} 