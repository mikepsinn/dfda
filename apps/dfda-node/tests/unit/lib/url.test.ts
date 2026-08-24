import { afterEach, describe, expect, it, vi } from 'vitest';

import { getBaseUrl, getCallbackUrl } from '@/lib/url';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('authentication URLs', () => {
  it('uses the canonical site URL instead of a generated Vercel deployment URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://prototype.dfda.earth');
    vi.stubEnv(
      'NEXT_PUBLIC_VERCEL_URL',
      'prototypedfdaearth-example-mike-p-sinns-projects.vercel.app',
    );

    expect(getBaseUrl()).toBe('https://prototype.dfda.earth/');
    expect(getCallbackUrl()).toBe('https://prototype.dfda.earth/auth/callback');
  });

  it('uses the Vercel deployment URL when no canonical site URL is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'dfda-preview.vercel.app');

    expect(getCallbackUrl()).toBe('https://dfda-preview.vercel.app/auth/callback');
  });

  it('normalizes a protocol-less Netlify deployment URL', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', '');
    vi.stubEnv('DEPLOY_PRIME_URL', 'dfda-preview.netlify.app');

    expect(getCallbackUrl()).toBe('https://dfda-preview.netlify.app/auth/callback');
  });

  it('upgrades non-localhost HTTP URLs to HTTPS', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://prototype.dfda.earth');

    expect(getBaseUrl()).toBe('https://prototype.dfda.earth/');
  });

  it('falls back to localhost outside a hosted environment', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', '');
    vi.stubEnv('DEPLOY_PRIME_URL', '');

    expect(getCallbackUrl('update-password')).toBe(
      'http://localhost:3000/update-password',
    );
  });
});
