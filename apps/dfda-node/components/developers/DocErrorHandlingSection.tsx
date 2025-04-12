import { CodeBlock } from "./CodeBlock"

export function DocErrorHandlingSection() {
  return (
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
    "documentation_url": "https://api.dfda.earth/docs/errors#invalid_request"
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
  )
} 