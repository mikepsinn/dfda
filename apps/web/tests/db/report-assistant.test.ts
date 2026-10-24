import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import demo from '@/scripts/demo-data.json'
import { adminDb, dbAs } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { EXAMPLE_REPORT } from '@/lib/biomarker-report/example'
import { assistantAvailable, DAILY_QUESTION_LIMIT, logQuestion, questionsAbout, saveAnswer } from '@/lib/care-team/ask'
import { acceptInvitation, inviteClinician, saveReport } from '@/lib/care-team/manage'
import { PROGRAM_TEMPLATES, programInputSchema } from '@/lib/programs/config'
import { findProgram } from '@/lib/programs/data'
import { joinProgram, saveProgram } from '@/lib/programs/manage'

// The report assistant's log of questions
// (db/migrations/20261023040000_table_report_questions.sql): who reads it, and
// the daily limit. The call to Claude is tested with a fake client in
// tests/unit/care-team/assistant.test.ts. See `pnpm test:db`.

const stamp = Date.now()
const slug = `assistant-${stamp}`
const otherSlug = `assistant-other-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
type User = { id: string; email: string; name: string }
let owner: User
let clinician: User
let patient: User
let stranger: User
let otherClinician: User
let instanceId: string
let reportId: string

async function newUser(label: string, name = label): Promise<User> {
  const email = `assistant-${label}-${stamp}@example.com`
  const id = await ensurePasswordUser(email, name, password)
  userIds.push(id)
  return { id, email, name }
}

async function addClinician(inviter: User, instanceSlug: string, member: User) {
  const result = await inviteClinician(inviter, instanceSlug, member.email)
  if (!('invitationId' in result)) throw new Error('Expected an invitation')
  await acceptInvitation(member, result.invitationId)
}

const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!

beforeAll(async () => {
  owner = await newUser('owner')
  clinician = await newUser('clinician', 'Dr. Asks')
  patient = await newUser('patient', 'Pat Report')
  stranger = await newUser('stranger')
  otherClinician = await newUser('other-clinician')
  instanceId = (await dbAs(owner).instances.create({ data: { slug, name: 'Assistant Clinic', owner_id: owner.id }, select: { id: true } })).id
  await dbAs(stranger).instances.create({ data: { slug: otherSlug, name: 'Other Clinic', owner_id: stranger.id }, select: { id: true } })
  await saveProgram(
    owner,
    slug,
    programInputSchema.parse({ name: 'GLP-1', slug: 'glp-1', summary: '', followUpWeeks: '12', careTeamReview: true, items: JSON.stringify(glp1.items) }),
  )
  const program = (await findProgram(slug, 'glp-1'))!
  await addClinician(owner, slug, clinician)
  await addClinician(stranger, otherSlug, otherClinician)
  await joinProgram(patient, program, { scheduleNotifications: false })
  reportId = await saveReport(clinician, { programId: program.id, patientId: patient.id, report: EXAMPLE_REPORT })
})

afterAll(async () => {
  await adminDb.biomarker_reports.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.instances.deleteMany({ where: { slug: { in: [slug, otherSlug] } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('the report assistant', () => {
  it('is available only with an API key, and only on the demo clinic until there is a business associate agreement', () => {
    expect(assistantAvailable(demo.instance.id, 'a-key')).toBe(true)
    expect(assistantAvailable(demo.instance.id, undefined)).toBe(false)
    expect(assistantAvailable(instanceId, 'a-key')).toBe(false)
  })

  it("keeps the care team's questions and answers, which only the care team reads", async () => {
    const logged = await logQuestion({ user: clinician, reportId, instanceId, question: 'Why did ApoB fall?' })
    if (!('id' in logged)) throw new Error('Expected a logged question')
    expect(await questionsAbout(clinician, reportId)).toEqual([
      { id: logged.id, question: 'Why did ApoB fall?', askerName: 'Dr. Asks', createdAt: expect.any(Date), answer: null },
    ])
    const answer = { segments: [{ text: 'ApoB fell.', sources: [1] }], sources: [{ n: 1, kind: 'report' as const, quote: 'ApoB' }] }
    await saveAnswer(logged.id, answer)
    expect((await questionsAbout(clinician, reportId))[0].answer).toEqual(answer)

    // The person reads their report, not the care team's questions about it.
    for (const outsider of [patient, owner, otherClinician, stranger]) {
      expect(await questionsAbout(outsider, reportId)).toEqual([])
    }
    // Only the server writes the log.
    await expect(
      dbAs(clinician).report_questions.create({
        data: { report_id: reportId, instance_id: instanceId, asked_by: clinician.id, asker_name: 'Dr. Asks', question: 'Mine' },
        select: { id: true },
      }),
    ).rejects.toThrow(/permission denied/)
  })

  it("stops at the company's daily number of questions, and counts only the last day", async () => {
    const asked = await adminDb.report_questions.count({ where: { instance_id: instanceId } })
    await adminDb.report_questions.createMany({
      data: Array.from({ length: DAILY_QUESTION_LIMIT - asked }, (_, n) => ({
        report_id: reportId,
        instance_id: instanceId,
        asker_name: 'Dr. Asks',
        question: `Question ${n}`,
      })),
    })
    expect(await logQuestion({ user: clinician, reportId, instanceId, question: 'One more' })).toEqual({ limited: true })

    // Questions asked at the same time pass the limit one at a time: with one place left, one of twenty gets it.
    await adminDb.report_questions.deleteMany({ where: { instance_id: instanceId, question: 'Question 0' } })
    const together = await Promise.all(
      Array.from({ length: 20 }, (_, n) => logQuestion({ user: clinician, reportId, instanceId, question: `Together ${n}` })),
    )
    expect(together.filter((result) => 'id' in result)).toHaveLength(1)
    expect(await adminDb.report_questions.count({ where: { instance_id: instanceId } })).toBe(DAILY_QUESTION_LIMIT)
    const tomorrow = new Date(Date.now() + 25 * 60 * 60 * 1000)
    expect(await logQuestion({ user: clinician, reportId, instanceId, question: 'Tomorrow', now: tomorrow })).toEqual({ id: expect.any(String) })
  })
})
