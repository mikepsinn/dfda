export function DocRateLimitingSection() {
  return (
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
  )
} 