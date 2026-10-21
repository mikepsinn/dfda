import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The demo accounts, company and program that `pnpm db:seed:demo` makes. */
export const demo = JSON.parse(readFileSync(join(__dirname, '../../scripts/demo-data.json'), 'utf8')) as {
  password: string
  company: { email: string; name: string }
  memberEmail: string
  patient: { email: string; name: string }
  clinician: { email: string; name: string }
  people: number
  instance: { slug: string; name: string; tagline: string }
  program: { template: string }
}

/** Signed-in browser state for each account, written by auth.setup.ts. */
export const COMPANY_STATE = join(__dirname, '../../playwright/.auth/company.json')
export const MEMBER_STATE = join(__dirname, '../../playwright/.auth/member.json')
export const CLINICIAN_STATE = join(__dirname, '../../playwright/.auth/clinician.json')

export const memberEmail = (n: number) => demo.memberEmail.replace('{n}', String(n))

/** Opens a path on the demo company's site from the main host (the instance preview link). */
export const onInstance = (path: string) => `/i/${demo.instance.slug}?next=${encodeURIComponent(path)}`
