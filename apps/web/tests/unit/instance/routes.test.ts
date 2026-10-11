// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { isInstancePath } from '@/lib/instance/routes'

describe('the paths of a company instance', () => {
  it('include the home page, programs, sign-in, reminders, legal pages and the owner pages', () => {
    for (const path of [
      '/',
      '/programs',
      '/programs/glp-1/me',
      '/login',
      '/register',
      '/auth/callback',
      '/patient/reminders',
      '/patient/reminders/abc',
      '/terms',
      '/privacy',
      '/instances/acme/programs/new',
      '/i',
      '/i/acme',
      '/api/auth/sign-in/email',
      '/.well-known/oauth-authorization-server',
    ]) {
      expect(isInstancePath(path), path).toBe(true)
    }
  })

  it('include files and the framework paths', () => {
    for (const path of ['/videos/explainer.mp4', '/sw.js', '/_next/data/x.json', '/robots.txt']) {
      expect(isInstancePath(path), path).toBe(true)
    }
  })

  it("leave out the network's own pages", () => {
    for (const path of [
      '/treatment-rankings',
      '/outcome-labels/semaglutide',
      '/find-trials',
      '/patient',
      '/patient/conditions',
      '/patients',
      '/select-role',
      '/developers',
      '/programsx',
      '/instance',
    ]) {
      expect(isInstancePath(path), path).toBe(false)
    }
  })
})
