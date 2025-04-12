import { Card } from "@/components/ui/card"
import { CodeBlock } from "./CodeBlock"

export function DocAuthenticationSection() {
  return (
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
const headers = {\n  'Authorization': 'Bearer YOUR_API_KEY',\n  'Content-Type': 'application/json'\n};\n\nfetch('https://api.dfda.earth/v1/trials', { headers })\n  .then(response => response.json())\n  .then(data => console.log(data));`}
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

function redirectToAuth() {\n  const authUrl = new URL('https://api.dfda.earth/oauth/authorize');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPES);

  window.location.href = authUrl.toString();
}`}
            </CodeBlock>

            <CodeBlock title="2. Exchange Code for Token">
              {`// After receiving the code in your redirect URI
async function exchangeCodeForToken(code) {\n  const response = await fetch('https://api.dfda.earth/oauth/token', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/x-www-form-urlencoded',\n    },\n    body: new URLSearchParams({\n      grant_type: 'authorization_code',\n      code: code,\n      redirect_uri: REDIRECT_URI,\n      client_id: CLIENT_ID,\n      client_secret: 'YOUR_CLIENT_SECRET'\n    })\n  });

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

const headers = {\n  'Authorization': \`Bearer \${accessToken}\`,\n  'Content-Type': 'application/json'\n};\n

fetch('https://api.dfda.earth/v1/user/profile', { headers })\n  .then(response => response.json())\n  .then(data => console.log(data));`}
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
  )
} 