/**
 * The report assistant (lib/care-team/assistant.ts): a clinician of the care
 * team asks a question about a report, and the answer streams back as one
 * JSON event per line. The page (components/care-team/ReportAssistant.tsx)
 * builds the answer from the same events.
 */
import { MAX_QUESTION_LENGTH, type AnswerEvent } from '@/lib/care-team/assistant'
import { answerQuestion, assistantAvailable, logQuestion, saveAnswer } from '@/lib/care-team/ask'
import { findReport } from '@/lib/care-team/data'
import { dbAs } from '@/lib/db'
import { logger } from '@/lib/logger'
import { findProgramById } from '@/lib/programs/data'
import { getServerUser } from '@/lib/server-auth'

// An answer with a literature search can take a minute.
export const maxDuration = 120

const error = (status: number, message: string) => Response.json({ error: { message } }, { status })

export async function POST(req: Request, { params }: { params: Promise<{ report: string }> }) {
  const { report: reportId } = await params
  const user = await getServerUser()
  if (!user) return error(401, 'Sign in to ask about the report.')
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return error(400, 'Send the question as JSON.')
  }
  const question = typeof (body as { question?: unknown })?.question === 'string' ? (body as { question: string }).question.trim() : ''
  if (!question) return error(400, 'Write your question.')
  if (question.length > MAX_QUESTION_LENGTH) return error(400, `Keep the question under ${MAX_QUESTION_LENGTH.toLocaleString('en-US')} characters.`)

  // The person can read their own report too; only the care team asks the assistant.
  const saved = await findReport(user, reportId)
  const program = saved && (await findProgramById(saved.programId))
  const onCareTeam =
    program && (await dbAs(user).instance_clinicians.findFirst({ where: { user_id: user.id, instance_id: program.instanceId }, select: { user_id: true } }))
  if (!saved || !program || !onCareTeam || !assistantAvailable(program.instanceId)) {
    return error(404, 'The assistant is not available for this report.')
  }
  const logged = await logQuestion({ user, reportId, instanceId: program.instanceId, question })
  if ('limited' in logged) return error(429, 'The care team asked the most questions for today. Try again tomorrow.')

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AnswerEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      try {
        send({ type: 'status', text: 'Reading the report…' })
        const answering = answerQuestion(saved.report, question)
        let next = await answering.next()
        while (!next.done) {
          send(next.value)
          next = await answering.next()
        }
        if (next.value.segments.length > 0) {
          await saveAnswer(logged.id, next.value)
          send({ type: 'done', questionId: logged.id })
        }
      } catch (caught) {
        logger.error('The report assistant failed', {
          reportId,
          questionId: logged.id,
          error: caught instanceof Error ? caught.message : String(caught),
        })
        send({ type: 'error', message: 'The assistant could not answer now. Try again in a minute.' })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' } })
}
