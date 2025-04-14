import { TriggerClient } from "@trigger.dev/sdk";
// import type { NextApiRequest, NextApiResponse } from 'next'; // Unused
import { NextRequest, NextResponse } from 'next/server';
import "@/trigger/reminders";

// Client definition remains the same
export const client = new TriggerClient({
  id: "dfda-node-api",
  apiKey: process.env.TRIGGER_API_KEY,
});

// Define the handler using the Pages Router pattern
// Note: Next.js App Router usually expects named exports (GET, POST, etc.)
// but we can try exporting a default handler that adapts the request.
// This might or might not work depending on how Next.js handles default exports in app/api.
async function handler(req: NextRequest) {
  // Adapt the NextRequest to something the client handler expects (if necessary)
  // The client's internal handler might be compatible enough.
  // We pass the client and the raw request.
  const response = await client.handleRequest(req);

  // Check status code for success (typically 2xx)
  if (response.status >= 200 && response.status < 300) {
    return new NextResponse(response.body, { status: response.status, headers: response.headers }); // Pass headers too
  } else {
    console.error("Trigger.dev handler error:", response);
    return new NextResponse(response.body ?? "Failed to handle Trigger.dev request", { status: response.status ?? 500, headers: response.headers });
  }
}

// Export named methods expected by App Router, delegating to the handler
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        return await handler(request);
    } catch (error) {
        console.error("Error in Trigger.dev POST handler:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// Recommended: Ensure the route is dynamic
export const dynamic = "force-dynamic"; 