import { exampleReportFor } from '@/lib/biomarker-report/example'
import { dbAs, type DbUser } from '@/lib/db'
import { joinedProgramIds, listPrograms, type Program } from '@/lib/programs/data'

/**
 * The menu of a company's site for the person who views it. A visitor gets the
 * programs, how it works, the example report and the demo; a member, their
 * program and reminders; a clinician of the care team, the patients with the
 * reports that wait for review; the owner, the site's settings. A person with
 * several roles gets the links of each. Server only.
 */

export type MenuLink = { href: string; label: string; count?: number }

export type InstanceMenu = { links: MenuLink[]; exampleHref: string | null }

/** The example report of the site: the first program with a full example report, or the first program's. */
export function exampleHrefFor(programs: Pick<Program, 'slug' | 'items'>[]): string | null {
  const program = programs.find((candidate) => exampleReportFor(candidate)) ?? programs[0]
  return program ? `/programs/${program.slug}/example` : null
}

export async function instanceMenu(
  user: DbUser | null,
  instance: { id: string; slug: string; demoEnabled: boolean },
): Promise<InstanceMenu> {
  const programs = await listPrograms(instance.slug)
  const exampleHref = exampleHrefFor(programs)
  if (!user) {
    const links: MenuLink[] = [
      { href: '/programs', label: 'Programs' },
      { href: '/#how', label: 'How it works' },
      ...(exampleHref ? [{ href: exampleHref, label: 'Example report' }] : []),
      ...(instance.demoEnabled ? [{ href: '/#try', label: 'Try the demo' }] : []),
    ]
    return { links, exampleHref }
  }

  const db = dbAs(user)
  const [joined, clinician, owned, toReview] = await Promise.all([
    joinedProgramIds(user, programs.map((program) => program.id)),
    db.instance_clinicians.findFirst({ where: { instance_id: instance.id, user_id: user.id }, select: { user_id: true } }),
    db.instances.findFirst({ where: { id: instance.id, owner_id: user.id }, select: { id: true } }),
    // The reports that this clinician can see (row-level security) and that wait for review; not their own.
    db.biomarker_reports.count({
      where: { reviewed_at: null, user_id: { not: user.id }, instance_programs: { instance_id: instance.id } },
    }),
  ])
  const mine = programs.filter((program) => joined.has(program.id))
  const links: MenuLink[] = []
  if (mine.length === 1) links.push({ href: `/programs/${mine[0].slug}/me`, label: 'My program' })
  if (mine.length > 1) links.push({ href: '/programs', label: 'My programs' })
  if (mine.length > 0) links.push({ href: '/patient/reminders', label: 'Reminders' })
  if (clinician) links.push({ href: `/instances/${instance.slug}/care`, label: 'Patients', count: toReview })
  if (owned) links.push({ href: `/instances/${instance.slug}`, label: 'Site settings' })
  if (mine.length !== 1 || links.length === 0) links.push({ href: '/programs', label: 'Programs' })
  // A member with one program gets the other programs from their program page.
  return { links: dedupe(links), exampleHref }
}

function dedupe(links: MenuLink[]): MenuLink[] {
  return links.filter((link, index) => links.findIndex((other) => other.href === link.href) === index)
}
