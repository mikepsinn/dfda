/**
 * Fills a local or CI database with a demo company instance, its GLP-1
 * program and people who joined it, so the company and program pages have
 * something to show. The Visual Preview workflow screenshots them.
 *
 * The accounts and names are in demo-data.json. The people's values come from
 * the sample generator (lib/programs/sample.ts): they are made up. Fixed ids
 * and dates counted in whole days make two runs on the same day give the same
 * pages. Running it again on a seeded database changes nothing.
 *
 * Usage: DATABASE_URL=postgresql://localhost/... tsx scripts/seed-demo.ts [--allow-remote]
 * It refuses a database that is not on this machine unless --allow-remote is given.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { adminDb } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { PROGRAM_TEMPLATES } from '@/lib/programs/config'
import { findProgramById } from '@/lib/programs/data'
import { joinProgram } from '@/lib/programs/manage'
import { sampleCohort } from '@/lib/programs/sample'

type DemoData = {
  password: string
  company: { email: string; name: string }
  memberEmail: string
  people: number
  instance: { id: string; slug: string; name: string; tagline: string; primaryColor: string; products: string[] }
  program: { id: string; template: string }
}

const demo = JSON.parse(readFileSync(join(__dirname, 'demo-data.json'), 'utf8')) as DemoData

function requireLocalDatabase() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const host = new URL(url).hostname
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host) && !process.argv.includes('--allow-remote')) {
    throw new Error(`The database is on ${host}. The demo data is for local and CI databases; add --allow-remote to use it anyway.`)
  }
}

async function seedProgram(ownerId: string) {
  const instance = await adminDb.instances.findUnique({ where: { id: demo.instance.id }, select: { id: true } })
  if (!instance) {
    await adminDb.instances.create({
      data: {
        id: demo.instance.id,
        slug: demo.instance.slug,
        name: demo.instance.name,
        tagline: demo.instance.tagline,
        primary_color: demo.instance.primaryColor,
        products: demo.instance.products,
        owner_id: ownerId,
      },
      select: { id: true },
    })
  }

  if (!(await adminDb.instance_programs.findUnique({ where: { id: demo.program.id }, select: { id: true } }))) {
    const template = PROGRAM_TEMPLATES.find((candidate) => candidate.key === demo.program.template)
    if (!template) throw new Error(`No program template "${demo.program.template}".`)
    const known = new Set(
      (await adminDb.global_variables.findMany({
        where: { id: { in: template.items.map((item) => item.variableId) } },
        select: { id: true },
      })).map((variable) => variable.id),
    )
    await adminDb.instance_programs.create({
      data: {
        id: demo.program.id,
        instance_id: demo.instance.id,
        slug: template.slug,
        name: template.name,
        summary: template.summary,
        follow_up_weeks: template.followUpWeeks,
        instance_program_items: {
          create: template.items
            .filter((item) => known.has(item.variableId))
            .map((item, position) => ({
              kind: item.kind,
              global_variable_id: item.variableId,
              frequency: item.kind === 'lab' ? null : item.frequency,
              better: item.kind === 'dose' ? null : item.better,
              default_value: item.kind === 'dose' ? item.defaultValue : null,
              position,
            })),
        },
      },
      select: { id: true },
    })
  }
  const program = await findProgramById(demo.program.id)
  if (!program) throw new Error('The demo program was not saved.')
  return program
}

async function main() {
  requireLocalDatabase()
  const ownerId = await ensurePasswordUser(demo.company.email, demo.company.name, demo.password)
  const program = await seedProgram(ownerId)

  // The same made-up people as the program's "Sample data" view, as real accounts.
  const people = sampleCohort({
    seedKey: program.id,
    items: program.items,
    followUpWeeks: program.followUpWeeks,
    now: new Date(),
    size: demo.people,
  })
  let joined = 0
  for (const [index, person] of people.entries()) {
    const email = demo.memberEmail.replace('{n}', String(index + 1))
    const user = { id: await ensurePasswordUser(email, `Demo Member ${index + 1}`, demo.password) }
    if ((await joinProgram(user, program, { scheduleNotifications: false })).joined === false) continue
    await adminDb.program_enrollments.updateMany({
      where: { program_id: program.id, user_id: user.id },
      data: { started_at: person.startedAt },
    })
    for (const item of program.items) {
      const points = person.series.get(item.variableId)
      if (!points?.length) continue
      const userVariable = await adminDb.user_variables.upsert({
        where: { user_id_global_variable_id: { user_id: user.id, global_variable_id: item.variableId } },
        create: { user_id: user.id, global_variable_id: item.variableId },
        update: {},
        select: { id: true },
      })
      await adminDb.measurements.createMany({
        data: points.map((point) => ({
          user_id: user.id,
          global_variable_id: item.variableId,
          user_variable_id: userVariable.id,
          value: point.value,
          unit_id: item.unitId,
          start_at: point.at,
          notes: 'Demo data',
        })),
      })
    }
    joined++
  }
  console.log(`Demo data: ${demo.instance.name} (/i/${demo.instance.slug}), program "${program.name}", ${joined} people joined now.`)
}

main()
  .then(() => adminDb.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error)
    await adminDb.$disconnect()
    process.exit(1)
  })
