import { adminDb } from '@/lib/db'
import { linkEmail, sendEmail, type Email, type EmailBrand } from '@/lib/email'
import { companySiteOrigin, findInstanceBySlug } from '@/lib/instance/hosts'
import { isDomainConfigured } from '@/lib/instance/vercel-domains'
import { logger } from '@/lib/logger'
import { companyPageUrl } from './data'

/**
 * Emails about biomarker reports, from the company: to the person when a
 * report is added and when a clinician signs it off, and to the other
 * clinicians of the care team when a report waits for review. They say what
 * happened and link to the page. They hold no values, decisions or notes,
 * because email is not a safe place for health data. A failed email is
 * logged; the report stays as it is. Server only.
 */

/** The company of an instance for its emails, and the address of its site. */
export async function companyOf(slug: string) {
  const instance = await findInstanceBySlug(slug)
  if (!instance) return null
  const domainConnected = instance.customDomain ? await isDomainConfigured(instance.customDomain, instance.slug) : null
  return { instance, origin: companySiteOrigin(instance, domainConnected) }
}

export type ReportNews = 'added' | 'reviewed'

/** What the emails need of a report: its person, program, company and care team. */
async function reportContext(reportId: string) {
  const report = await adminDb.biomarker_reports.findUnique({
    where: { id: reportId },
    select: {
      user_id: true,
      program_id: true,
      uploaded_by: true,
      reviewed_by: true,
      reviewer_name: true,
      patient: { select: { email: true } },
      instance_programs: { select: { slug: true, name: true, instance_id: true, instances: { select: { slug: true } } } },
    },
  })
  if (!report) return null
  const program = report.instance_programs
  const [company, enrollment, clinicians] = await Promise.all([
    companyOf(program.instances.slug),
    adminDb.program_enrollments.findUnique({
      where: { program_id_user_id: { program_id: report.program_id, user_id: report.user_id } },
      select: { id: true },
    }),
    adminDb.instance_clinicians.findMany({
      where: { instance_id: program.instance_id },
      select: { user_id: true, profiles: { select: { email: true } } },
    }),
  ])
  if (!company) return null
  const brand: EmailBrand = {
    name: company.instance.name,
    primaryColor: company.instance.primaryColor,
    supportEmail: company.instance.supportEmail,
  }
  const url = (path: string) => companyPageUrl(company.instance.slug, path, company.origin)
  return { report, program, enrollment, clinicians, brand, url }
}

/** The emails for news of a report; empty when the report or its company is gone. */
export async function reportEmails(news: ReportNews, reportId: string): Promise<Email[]> {
  const context = await reportContext(reportId)
  if (!context) return []
  const { report, program, enrollment, clinicians, brand, url } = context
  const personLink = url(`/programs/${program.slug}/me/reports/${reportId}`)
  const personFooter = `You get this email because you are in ${brand.name}'s ${program.name}.`

  if (news === 'reviewed') {
    return [
      linkEmail(
        report.patient.email,
        'Your biomarker report is reviewed',
        `${report.reviewer_name ?? 'A clinician'} of ${brand.name}'s care team reviewed your biomarker report. Open the report to see the review.`,
        'Open the report',
        personLink,
        brand,
        personFooter,
      ),
    ]
  }

  const emails = [
    linkEmail(
      report.patient.email,
      'You have a new biomarker report',
      `${brand.name} added a new biomarker report to your ${program.name}. Open it to see how your markers changed. A clinician of the care team reviews it next.`,
      'Open the report',
      personLink,
      brand,
      personFooter,
    ),
  ]
  if (enrollment) {
    const careLink = url(`/instances/${program.instances.slug}/care/${enrollment.id}/reports/${reportId}`)
    for (const clinician of clinicians) {
      if (clinician.user_id === report.uploaded_by) continue
      emails.push(
        linkEmail(
          clinician.profiles.email,
          'A biomarker report waits for review',
          `A new biomarker report in ${program.name} waits for the review of ${brand.name}'s care team.`,
          'Review the report',
          careLink,
          brand,
          `You get this email because you are on ${brand.name}'s care team.`,
        ),
      )
    }
  }
  return emails
}

/** Sends the emails for news of a report. Never throws: a failure is logged without the email's text. */
export async function notifyReport(news: ReportNews, reportId: string): Promise<void> {
  try {
    const emails = await reportEmails(news, reportId)
    const results = await Promise.allSettled(emails.map((email) => sendEmail(email)))
    const failed = results.filter((result) => result.status === 'rejected')
    if (failed.length > 0) {
      logger.error('Could not send emails about a biomarker report', {
        news,
        reportId,
        failed: failed.length,
        of: emails.length,
        error: String((failed[0] as PromiseRejectedResult).reason),
      })
    }
  } catch (error) {
    logger.error('Could not prepare emails about a biomarker report', {
      news,
      reportId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
