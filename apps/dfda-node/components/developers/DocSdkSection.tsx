import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { CodeBlock } from "./CodeBlock"

export function DocSdkSection() {
  return (
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
            {`npm install dfda-js-sdk

# or with yarn
yarn add dfda-js-sdk`}
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
  )
} 