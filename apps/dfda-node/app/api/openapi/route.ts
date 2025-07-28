import { NextResponse } from 'next/server';
import { fetchAndProcessOpenApiSpec } from '@/lib/openapi-fetcher';

export async function GET() {
  const spec = await fetchAndProcessOpenApiSpec();
  if (!spec) {
    return NextResponse.json({ error: 'Failed to load OpenAPI spec' }, { status: 500 });
  }
  return NextResponse.json(spec);
} 