import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // Corrected path
// import { cookies } from 'next/headers'; // No longer needed directly here
import { logger } from '@/lib/logger';

// Ensure Supabase URL and Anon Key are available server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL; // Add this to get site URL

// Define allowed HTTP methods (optional, but good practice)
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

async function handler(req: NextRequest, { params }: { params: { slug: string[] } }) {
    // Check if Supabase creds are configured
    if (!supabaseUrl || !supabaseAnonKey || !siteUrl) { // Check siteUrl as well
        logger.error('[API Supabase Proxy] Missing Supabase URL, Anon Key, or Site URL environment variables.');
        return new NextResponse('API configuration error', { status: 500 });
    }

    // Handle potentially undefined slug for optional catch-all routes
    const slugArray = params.slug || []; // If slug is undefined (e.g. path is /api/sb), default to empty array
    const slugPath = slugArray.join('/');

    // Handle OPTIONS preflight requests for CORS (moved before spec check for clarity)
    if (req.method === 'OPTIONS') {
        const corsHeaders = new Headers();
        corsHeaders.set('Access-Control-Allow-Origin', '*'); // Or specify your frontend origin
        corsHeaders.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
        corsHeaders.set('Access-Control-Allow-Headers', 'authorization, apikey, content-type, prefer, x-client-info'); // Added x-client-info
        return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    // If GET request to the root (empty slugPath), serve modified OpenAPI spec
    if (req.method === 'GET' && slugPath === '') {
        try {
            logger.info('[API Supabase Proxy] Fetching OpenAPI spec from Supabase root.');
            const specRes = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': supabaseAnonKey, // Supabase requires apikey for the spec
                }
            });

            if (!specRes.ok) {
                logger.error(`[API Supabase Proxy] Failed to fetch OpenAPI spec from Supabase. Status: ${specRes.status}`);
                return new NextResponse('Failed to fetch OpenAPI spec from upstream', { status: specRes.status });
            }

            const spec = await specRes.json();

            // Modify the servers URL
            const proxyApiBaseUrl = `${siteUrl.replace(/\/$/, '')}/api/sb`;
            spec.servers = [{ url: proxyApiBaseUrl, description: 'DFDA API Proxy' }];
            
            // Modify paths to be relative to the new server URL if necessary (OpenAPI v3 usually handles this with server URL)
            // For example, if paths were /rest/v1/table, they might need to become /table.
            // However, with a single server entry, clients should combine server URL + path correctly.
            // Let's assume for now that paths are relative enough or clients handle it.

            logger.info('[API Supabase Proxy] Serving modified OpenAPI spec.');
            const responseHeaders = new Headers();
            responseHeaders.set('Content-Type', 'application/json');
            responseHeaders.set('Access-Control-Allow-Origin', '*'); // Add CORS for the spec itself

            return new NextResponse(JSON.stringify(spec), {
                status: 200,
                headers: responseHeaders
            });

        } catch (error: any) {
            logger.error('[API Supabase Proxy] Error processing OpenAPI spec:', { error: error.message });
            return new NextResponse('Error processing OpenAPI spec', { status: 500 });
        }
    }

    // Validate HTTP method (moved after spec check)
    if (!req.method || !ALLOWED_METHODS.includes(req.method)) {
        logger.warn(`[API Supabase Proxy] Disallowed method: ${req.method}`);
        return new NextResponse('Method Not Allowed', { status: 405 });
    }

    // Create Supabase client using the server utility and AWAIT it
    const supabase = await createClient(); 

    // Now use the resolved client directly
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        logger.warn('[API Supabase Proxy] Unauthorized access attempt.', { authError });
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // Extract the JWT for forwarding - use the resolved client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession(); 
    if (sessionError || !session) {
        logger.error('[API Supabase Proxy] Could not retrieve session token even though user exists.', { sessionError, userId: user.id });
        return new NextResponse('Internal Server Error', { status: 500 });
    }
    const jwt = session.access_token;

    // Construct the target Supabase PostgREST URL
    const targetUrl = `${supabaseUrl}/rest/v1/${slugPath}${req.nextUrl.search}`; // Include query params

    // Prepare headers to forward
    const headersToForward = new Headers();
    headersToForward.set('apikey', supabaseAnonKey);
    headersToForward.set('Authorization', `Bearer ${jwt}`);
    
    // Forward relevant client headers (like Content-Type, Prefer, Accept)
    const contentType = req.headers.get('content-type');
    const preferHeader = req.headers.get('prefer');
    const acceptHeader = req.headers.get('accept');
    
    if (contentType) headersToForward.set('Content-Type', contentType);
    if (preferHeader) headersToForward.set('Prefer', preferHeader);
    if (acceptHeader) headersToForward.set('Accept', acceptHeader); // Often important for PostgREST

    // Handle request body for relevant methods
    let body: BodyInit | null | undefined = undefined;
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        // Use ReadableStream directly for efficient proxying
        body = req.body;
    }

    try {
        logger.info(`[API Supabase Proxy] Forwarding ${req.method} to ${targetUrl}`);
        const proxyRes = await fetch(targetUrl, {
            method: req.method,
            headers: headersToForward,
            body: body,
            // Important: Prevent fetch from interfering with streaming
            // duplex: 'half' is required for streaming request bodies in some environments
            // @ts-expect-error - duplex is not in standard Fetch options type but required for streaming body
            duplex: 'half', 
        });

        // Log non-OK responses from Supabase
        if (!proxyRes.ok) {
            logger.warn(`[API Supabase Proxy] Received non-OK status ${proxyRes.status} from Supabase`, {
                targetUrl,
                method: req.method,
                supabaseStatus: proxyRes.status,
                supabaseStatusText: proxyRes.statusText,
            });
            // Consider logging response body here if needed for debugging, but be careful with large responses
        }

        // Stream the response back to the client
        // Create a new NextResponse with the streamed body and original headers
        const responseHeaders = new Headers(proxyRes.headers);
        // Add CORS headers if needed for browser clients
        responseHeaders.set('Access-Control-Allow-Origin', '*'); // Adjust as needed

        return new NextResponse(proxyRes.body, {
            status: proxyRes.status,
            statusText: proxyRes.statusText,
            headers: responseHeaders,
        });

    } catch (error: any) {
        logger.error('[API Supabase Proxy] Error fetching from Supabase:', {
             targetUrl, method: req.method, error: error.message 
        });
        return new NextResponse('Proxy request failed', { status: 502 }); // Bad Gateway
    }
}

// Export handlers for all allowed methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler; // Explicitly export OPTIONS handler 