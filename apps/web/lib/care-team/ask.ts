import Anthropic from '@anthropic-ai/sdk'
import demo from '@/scripts/demo-data.json'
import type { BiomarkerReport } from '@/lib/biomarker-report/schema'
import { adminDb, dbAs, type DbUser } from '@/lib/db'
import { env } from '@/lib/env'
import {
  applyEvent,
  ASSISTANT_INSTRUCTIONS,
  citationEvents,
  emptyAnswer,
  LITERATURE_DOMAINS,
  reportDocument,
  type Answer,
  type AnswerEvent,
  type Citation,
} from './assistant'

/**
 * The report assistant's server side (assistant.ts): the call to the Claude
 * API, and the care team's log of questions
 * (db/migrations/20261023040000_table_report_questions.sql). Server only.
 *
 * Health data goes to the Claude API only under a business associate
 * agreement. Until there is one, the assistant answers only about the demo
 * clinic's reports, whose values are made up.
 */

export const ASSISTANT_MODEL = 'claude-opus-5-5'
/** Questions a day for each company: every visitor of the demo shares its clinician's account. */
export const DAILY_QUESTION_LIMIT = 50
/** Server-side tool loops that end in pause_turn are resumed at most this often. */
const MAX_CONTINUATIONS = 2

/** Whether the care team of this company can ask the assistant: with an API key, and only on the demo clinic for now. */
export function assistantAvailable(instanceId: string, apiKey = env.ANTHROPIC_API_KEY): boolean {
  return Boolean(apiKey) && instanceId === demo.instance.id
}

/** A question in the care team's log, with its answer when it is complete. */
export type SavedQuestion = { id: string; question: string; askerName: string; createdAt: Date; answer: Answer | null }

/** The questions that the page shows: the newest ones. */
export const SHOWN_QUESTIONS = 10

/** The newest questions about a report, oldest first, for a clinician who can see the report; empty for anyone else. */
export async function questionsAbout(user: DbUser, reportId: string): Promise<SavedQuestion[]> {
  const rows = await dbAs(user).report_questions.findMany({
    where: { report_id: reportId },
    select: { id: true, question: true, asker_name: true, created_at: true, answer: true },
    orderBy: { created_at: 'desc' },
    take: SHOWN_QUESTIONS,
  })
  return rows.reverse().map((row) => ({
    id: row.id,
    question: row.question,
    askerName: row.asker_name,
    createdAt: row.created_at,
    answer: row.answer as Answer | null,
  }))
}

/**
 * Logs a question before the assistant answers it, unless the company asked
 * its daily number of questions already. The caller has checked that the
 * user is on the care team of the report's company.
 */
export async function logQuestion(input: {
  user: { id: string; name: string }
  reportId: string
  instanceId: string
  question: string
  now?: Date
}): Promise<{ id: string } | { limited: true }> {
  const since = new Date((input.now ?? new Date()).getTime() - 24 * 60 * 60 * 1000)
  const asked = await adminDb.report_questions.count({ where: { instance_id: input.instanceId, created_at: { gte: since } } })
  if (asked >= DAILY_QUESTION_LIMIT) return { limited: true }
  const row = await adminDb.report_questions.create({
    data: {
      report_id: input.reportId,
      instance_id: input.instanceId,
      asked_by: input.user.id,
      asker_name: input.user.name.trim().slice(0, 120) || 'A clinician',
      question: input.question,
      model: ASSISTANT_MODEL,
    },
    select: { id: true },
  })
  return { id: row.id }
}

export async function saveAnswer(questionId: string, answer: Answer) {
  await adminDb.report_questions.update({
    where: { id: questionId },
    data: { answer, answered_at: new Date() },
    select: { id: true },
  })
}

function toCitation(citation: Anthropic.Beta.BetaCitationsDelta['citation']): Citation | null {
  if (citation.type === 'web_search_result_location') {
    return { kind: 'literature', title: citation.title, url: citation.url, quote: citation.cited_text }
  }
  if (citation.type === 'char_location') return { kind: 'report', quote: citation.cited_text }
  return null
}

/**
 * Streams the answer to a question about a report, as events for the page,
 * and returns the whole answer. Claude reads the report as a cited document
 * and searches the literature on LITERATURE_DOMAINS only.
 */
export async function* answerQuestion(
  report: BiomarkerReport,
  question: string,
  client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }),
): AsyncGenerator<AnswerEvent, Answer> {
  let answer = emptyAnswer()
  const emit = (event: AnswerEvent) => {
    answer = applyEvent(answer, event)
    return event
  }
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'text', media_type: 'text/plain', data: reportDocument(report) },
          title: 'Biomarker report',
          citations: { enabled: true },
          // The same report and instructions start every question about it.
          cache_control: { type: 'ephemeral' },
        },
        { type: 'text', text: question },
      ],
    },
  ]

  for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
    const stream = client.beta.messages.stream({
      model: ASSISTANT_MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      system: ASSISTANT_INSTRUCTIONS,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 4, allowed_domains: LITERATURE_DOMAINS }],
      // When a safety classifier declines, the API answers with the model it recommends for that case.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages,
    })
    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'text') yield emit({ type: 'segment' })
        else if (event.content_block.type === 'server_tool_use') yield emit({ type: 'status', text: 'Searching the medical literature…' })
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') yield emit({ type: 'text', text: event.delta.text })
        else if (event.delta.type === 'citations_delta') {
          const citation = toCitation(event.delta.citation)
          if (citation) for (const next of citationEvents(answer, citation)) yield emit(next)
        }
      }
    }
    const message = await stream.finalMessage()
    if (message.stop_reason === 'refusal') {
      yield emit({ type: 'error', message: 'The assistant cannot answer this question. Ask it in another way.' })
      return answer
    }
    if (message.stop_reason !== 'pause_turn') break
    // A long literature search pauses the turn; sending it back resumes it.
    messages.push({ role: 'assistant', content: message.content as Anthropic.Beta.BetaContentBlockParam[] })
  }
  return answer
}
