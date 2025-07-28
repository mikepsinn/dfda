export function AuthenticationSection() {
  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border p-4">
        <h4 className="text-base font-medium mb-2">API Key Authentication</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Use API keys to access public data like clinical trials, outcome labels, and comparative effectiveness data.
          Include your API key in the Authorization header of all your requests.
        </p>
        <div className="rounded-lg bg-muted p-4 mt-2">
          <code className="text-sm">Authorization: Bearer YOUR_API_KEY</code>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h4 className="text-base font-medium mb-2">OAuth2 Authentication</h4>
        <p className="text-sm text-muted-foreground mb-2">
          Use OAuth2 to access user-specific data and perform actions on behalf of users, such as enrolling in trials or
          submitting trial data.
        </p>
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Authorization Flow</h5>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>
              Redirect users to <code>https://api.dfda.earth/oauth/authorize</code>
            </li>
            <li>User authenticates and grants permission to your app</li>
            <li>User is redirected back to your app with an authorization code</li>
            <li>Exchange the code for an access token</li>
            <li>Use the access token to make API requests on behalf of the user</li>
          </ol>

          <h5 className="text-sm font-medium mt-3">Example Token Request</h5>
          <div className="rounded-lg bg-muted p-4 mt-1">
            <pre className="text-sm overflow-auto">
              {`POST https://api.dfda.earth/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=YOUR_REDIRECT_URI
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET`}
            </pre>
          </div>

          <h5 className="text-sm font-medium mt-3">Using Access Tokens</h5>
          <div className="rounded-lg bg-muted p-4 mt-1">
            <code className="text-sm">Authorization: Bearer ACCESS_TOKEN</code>
          </div>

          <h5 className="text-sm font-medium mt-3">Available Scopes</h5>
          <div className="grid grid-cols-2 gap-2 text-sm mt-1">
            <div className="font-medium">Scope</div>
            <div className="font-medium">Description</div>
            <div>trials:read</div>
            <div>View public trials</div>
            <div>trials:write</div>
            <div>Create and manage trials (for research partners)</div>
            <div>user:read</div>
            <div>Access basic user profile</div>
            <div>user.trials:read</div>
            <div>View user's trial participation</div>
            <div>user.trials:write</div>
            <div>Enroll user in trials</div>
            <div>user.data:read</div>
            <div>Access user's health data</div>
            <div>user.data:write</div>
            <div>Submit data on user's behalf</div>
          </div>
        </div>
      </div>
    </div>
  )
}

