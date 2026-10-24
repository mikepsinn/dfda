import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb, dbAs, type Prisma } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { EXAMPLE_REPORT } from '@/lib/biomarker-report/example'
import { instanceMenu } from '@/lib/instance/menu'
import { PROGRAM_TEMPLATES, programInputSchema } from '@/lib/programs/config'
import { findProgram } from '@/lib/programs/data'
import { joinProgram, saveProgram } from '@/lib/programs/manage'

// The menu of a company's site for each role there (lib/instance/menu.ts). See `pnpm test:db`.

const stamp = Date.now()
const slug = `menu-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
let instance: { id: string; slug: string; demoEnabled: boolean }
let owner: { id: string }
let member: { id: string }
let clinician: { id: string }

const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!
const labels = (menu: Awaited<ReturnType<typeof instanceMenu>>) => menu.links.map((link) => [link.label, link.href, link.count ?? null])

beforeAll(async () => {
  owner = { id: await ensurePasswordUser(`menu-owner-${stamp}@example.com`, 'Owner', password) }
  member = { id: await ensurePasswordUser(`menu-member-${stamp}@example.com`, 'Member', password) }
  clinician = { id: await ensurePasswordUser(`menu-clinician-${stamp}@example.com`, 'Clinician', password) }
  userIds.push(owner.id, member.id, clinician.id)
  const created = await dbAs(owner).instances.create({ data: { slug, name: 'Menu Clinic', owner_id: owner.id }, select: { id: true } })
  instance = { id: created.id, slug, demoEnabled: true }
  await saveProgram(
    owner,
    slug,
    programInputSchema.parse({ name: 'GLP-1', slug: 'glp-1', summary: '', followUpWeeks: '12', items: JSON.stringify(glp1.items) }),
  )
  const program = (await findProgram(slug, 'glp-1'))!
  await joinProgram(member, program, { scheduleNotifications: false })
  await adminDb.instance_clinicians.create({ data: { instance_id: instance.id, user_id: clinician.id } })
  await adminDb.biomarker_reports.create({
    data: {
      program_id: program.id,
      user_id: member.id,
      data: EXAMPLE_REPORT as unknown as Prisma.InputJsonValue,
      title: EXAMPLE_REPORT.title,
      report_date: new Date(`${EXAMPLE_REPORT.reportDate}T00:00:00Z`),
    },
  })
})

afterAll(async () => {
  await adminDb.biomarker_reports.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.instances.deleteMany({ where: { slug } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe("a company site's menu", () => {
  it('shows a visitor the programs, how it works, the example report and the demo', async () => {
    const menu = await instanceMenu(null, instance)
    expect(labels(menu)).toEqual([
      ['Programs', '/programs', null],
      ['How it works', '/#how', null],
      ['Example report', '/programs/glp-1/example', null],
      ['Try the demo', '/#try', null],
    ])
    expect(menu.exampleHref).toBe('/programs/glp-1/example')
    expect(labels(await instanceMenu(null, { ...instance, demoEnabled: false })).map(([label]) => label)).not.toContain('Try the demo')
  })

  it('shows a member their program and reminders', async () => {
    expect(labels(await instanceMenu(member, instance))).toEqual([
      ['My program', '/programs/glp-1/me', null],
      ['Reminders', '/patient/reminders', null],
    ])
  })

  it('shows a clinician of the care team the patients, with the reports that wait for review', async () => {
    expect(labels(await instanceMenu(clinician, instance))).toEqual([
      ['Patients', `/instances/${slug}/care`, 1],
      ['Programs', '/programs', null],
    ])
  })

  it("shows the owner the site's settings, and the patients too when they are on the care team", async () => {
    expect(labels(await instanceMenu(owner, instance))).toEqual([
      ['Site settings', `/instances/${slug}`, null],
      ['Programs', '/programs', null],
    ])
    await adminDb.instance_clinicians.create({ data: { instance_id: instance.id, user_id: owner.id } })
    expect(labels(await instanceMenu(owner, instance)).map(([label]) => label)).toEqual(['Patients', 'Site settings', 'Programs'])
  })
})
