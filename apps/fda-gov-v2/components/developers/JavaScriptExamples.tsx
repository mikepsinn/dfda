import { CodeBlock } from "./CodeBlock"

export function JavaScriptExamples() {
  return (
    <>
      <CodeBlock title="Fetch Clinical Trials">
        {`// Using fetch API
const API_KEY = 'your_api_key';

async function getTrials() {
  try {
    const response = await fetch('https://api.fdav2.gov/v1/trials?condition=diabetes&limit=10', {
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching trials:', error);
  }
}

getTrials();`}
      </CodeBlock>

      <CodeBlock title="Compare Treatment Effectiveness">
        {`// Using axios
import axios from 'axios';

const API_KEY = 'your_api_key';

async function compareEffectiveness() {
  try {
    const response = await axios.get('https://api.fdav2.gov/v1/effectiveness/compare', {
      params: {
        treatments: 'metformin,glp1-agonists,sglt2-inhibitors',
        condition: 'type-2-diabetes'
      },
      headers: {
        'Authorization': \`Bearer \${API_KEY}\`
      }
    });

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error comparing effectiveness:', error);
  }
}

compareEffectiveness();`}
      </CodeBlock>

      <CodeBlock title="OAuth2 Authentication Flow">
        {`// Example OAuth2 flow in a web application
const CLIENT_ID = 'your_client_id';
const REDIRECT_URI = 'https://your-app.com/callback';

// Step 1: Redirect user to authorization page
function redirectToAuth() {
  const authUrl = new URL('https://api.fdav2.gov/oauth/authorize');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'user:read user.trials:read');

  window.location.href = authUrl.toString();
}

// Step 2: Handle the callback and exchange code for token
async function handleCallback() {
  // Get the authorization code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    try {
      // Exchange code for access token
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

      // Store the tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      console.log('Authentication successful!');
      return data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
    }
  }
}

// Step 3: Use the access token to make API requests
async function getUserProfile() {
  const accessToken = localStorage.getItem('access_token');

  try {
    const response = await fetch('https://api.fdav2.gov/v1/user/profile', {
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log('User profile:', data);
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
}`}
      </CodeBlock>
    </>
  )
}

