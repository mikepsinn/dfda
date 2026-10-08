import { type NextRequest, NextResponse } from 'next/server';
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
            spec.servers = [{ url: proxyApiBaseUrl, description: 'API proxy' }];
            
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

    // Data requests went to Supabase PostgREST with the user's Supabase
    // session token. Sign-in no longer uses Supabase, so there is no such
    // token, and the app database is no longer the Supabase one. The REST API
    // moves to the app itself in a later phase (docs/MIGRATION.md).
    logger.warn(`[API Supabase Proxy] Data request refused: ${req.method} /${slugPath}`);
    return NextResponse.json(
        { error: 'not_implemented', error_description: 'The data API is not available yet.' },
        { status: 501, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
}

// Export handlers for all allowed methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler; // Explicitly export OPTIONS handler 