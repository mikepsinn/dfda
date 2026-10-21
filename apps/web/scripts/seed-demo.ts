/**
 * Fills a local or CI database with the demo clinic (lib/demo/clinic.ts): a
 * company instance, its GLP-1 program, people who joined it, the demo
 * patient with their report and the clinician on the care team, so the
 * company and program pages have something to show. The Visual Preview
 * workflow screenshots them, and the browser tests (tests/e2e) use them. A
 * deployment gets the same clinic on its first demo sign-in instead.
 *
 * The accounts and names are in demo-data.json. The people's values come from
 * the sample generator (lib/programs/sample.ts): they are made up. Fixed ids
 * and dates counted in whole days make two runs on the same day give the same
 * pages. Running it again on a seeded database changes nothing.
 *
 * Usage: DATABASE_URL=postgresql://localhost/... tsx scripts/seed-demo.ts [--allow-remote]
 * It refuses a database that is not on this machine unless --allow-remote is given.
 */
import { adminDb } from '@/lib/db'
import {
  DEMO_CLINIC as demo,
  ensureDemoCareTeam,
  ensureDemoClinic,
  ensureDemoMembers,
  ensureDemoPatient,
  resetDemoPatient,
} from '@/lib/demo/clinic'

function requireLocalDatabase() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const host = new URL(url).hostname
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) && !process.argv.includes('--allow-remote')) {
    throw new Error(`The database is on ${host}. The demo data is for local and CI databases; add --allow-remote to use it anyway.`)
  }
}

async function main() {
  requireLocalDatabase()
  const { program } = await ensureDemoClinic()
  const joined = await ensureDemoMembers(program)
  const patientId = await ensureDemoPatient(program)
  await ensureDemoCareTeam(program, patientId)
  await resetDemoPatient(program, patientId)
  console.log(
    `Demo data: ${demo.instance.name} (/i/${demo.instance.slug}), program "${program.name}", ${joined} people joined now, the demo patient ${demo.patient.email} and the clinician ${demo.clinician.email}.`,
  )
}

main()
  .then(() => adminDb.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error)
    await adminDb.$disconnect()
    process.exit(1)
  })
