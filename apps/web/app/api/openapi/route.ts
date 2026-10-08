import { NextResponse } from 'next/server';

// The OpenAPI document came from Supabase's PostgREST API, which the app no
// longer uses. The REST API and its OpenAPI document move to the app itself in
// a later step (docs/MIGRATION.md).
export async function GET() {
  return NextResponse.json(
    { error: 'not_implemented', error_description: 'The API document is not available yet.' },
    { status: 501 },
  );
}
