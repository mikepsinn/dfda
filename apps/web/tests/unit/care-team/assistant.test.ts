// @vitest-environment node
import type Anthropic from '@anthropic-ai/sdk'
import { describe, expect, it } from 'vitest'
import { EXAMPLE_REPORT } from '@/lib/biomarker-report/example'
import { answerQuestion, ASSISTANT_MODEL } from '@/lib/care-team/ask'
import { applyEvent, citationEvents, emptyAnswer, LITERATURE_DOMAINS, reportDocument, type Answer, type AnswerEvent } from '@/lib/care-team/assistant'

describe('reportDocument', () => {
  it("gives the report's values and statuses, without the names of the person and the clinician", () => {
    const text = reportDocument(EXAMPLE_REPORT)
    expect(text).toContain(`Report: ${EXAMPLE_REPORT.title}`)
    const [first] = EXAMPLE_REPORT.timepoints
    expect(text).toContain(`${first.label} (week ${first.week})`)
    const marker = EXAMPLE_REPORT.panels[0].markers[0]
    expect(text).toMatch(new RegExp(`- ${marker.name} \\(${marker.id}, ${marker.unit}\\): .*; status (Improved|Unchanged|Review|Below LLOQ)`))
    expect(text).toContain(`Panel: ${EXAMPLE_REPORT.panels[0].name}.`)
    expect(text).not.toContain(EXAMPLE_REPORT.person.name)
    if (EXAMPLE_REPORT.clinician) expect(text).not.toContain(EXAMPLE_REPORT.clinician.name)
  })
})

describe('an answer', () => {
  const build = (events: AnswerEvent[]) => events.reduce(applyEvent, emptyAnswer())

  it('numbers each page of the literature once, and each quote of the report on its own', () => {
    let answer: Answer = build([{ type: 'segment' }, { type: 'text', text: 'ApoB fell.' }])
    const add = (citation: Parameters<typeof citationEvents>[1]) => {
      for (const event of citationEvents(answer, citation)) answer = applyEvent(answer, event)
    }
    add({ kind: 'report', quote: 'ApoB  fell by 18%' })
    add({ kind: 'literature', title: 'A trial', url: 'https://pubmed.ncbi.nlm.nih.gov/1/', quote: 'In the trial…' })
    add({ kind: 'literature', title: 'A trial', url: 'https://pubmed.ncbi.nlm.nih.gov/1/', quote: 'Another line' })
    answer = applyEvent(answer, { type: 'segment' })
    add({ kind: 'literature', title: 'A trial', url: 'https://pubmed.ncbi.nlm.nih.gov/1/', quote: 'Again' })
    add({ kind: 'report', quote: 'ALT rose' })
    expect(answer.sources).toEqual([
      { n: 1, kind: 'report', quote: 'ApoB fell by 18%' },
      { n: 2, kind: 'literature', title: 'A trial', url: 'https://pubmed.ncbi.nlm.nih.gov/1/', quote: 'In the trial…' },
      { n: 3, kind: 'report', quote: 'ALT rose' },
    ])
    expect(answer.segments.map((segment) => segment.sources)).toEqual([[1, 2], [2, 3]])
  })

  it('keeps text that comes before any segment', () => {
    expect(build([{ type: 'text', text: 'A' }, { type: 'text', text: 'B' }]).segments).toEqual([{ text: 'AB', sources: [] }])
  })
})

/** A fake Claude client: each call to stream() plays the next turn's events, then gives its final message. */
function fakeClient(turns: { events: unknown[]; stop_reason: string }[]) {
  const calls: Record<string, unknown>[] = []
  const client = {
    beta: {
      messages: {
        stream(params: Record<string, unknown>) {
          calls.push(structuredClone(params))
          const turn = turns[calls.length - 1]
          return {
            async *[Symbol.asyncIterator]() {
              yield* turn.events
            },
            finalMessage: async () => ({ stop_reason: turn.stop_reason, content: [{ type: 'text', text: 'paused part' }] }),
          }
        },
      },
    },
  }
  return { client: client as unknown as Anthropic, calls }
}

async function run(generator: AsyncGenerator<AnswerEvent, Answer>) {
  const events: AnswerEvent[] = []
  let next = await generator.next()
  while (!next.done) {
    events.push(next.value)
    next = await generator.next()
  }
  return { events, answer: next.value }
}

const textStart = { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '', citations: null } }
const text = (value: string) => ({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: value } })
const cite = (citation: Record<string, unknown>) => ({ type: 'content_block_delta', index: 0, delta: { type: 'citations_delta', citation } })

describe('answerQuestion', () => {
  it('asks Claude about the report as a cited document, searches only trusted sites, and resumes a paused turn', async () => {
    const { client, calls } = fakeClient([
      {
        events: [
          { type: 'content_block_start', index: 0, content_block: { type: 'server_tool_use', id: 's1', name: 'web_search', input: {} } },
          textStart,
          cite({ type: 'char_location', cited_text: 'ApoB: 95, 78', document_index: 0, document_title: 'Biomarker report', start_char_index: 1, end_char_index: 9 }),
          text('ApoB fell. '),
        ],
        stop_reason: 'pause_turn',
      },
      {
        events: [
          textStart,
          cite({ type: 'web_search_result_location', cited_text: 'Semaglutide lowered ApoB.', title: 'A trial', url: 'https://pubmed.ncbi.nlm.nih.gov/1/', encrypted_index: 'x' }),
          text('Trials saw the same.'),
        ],
        stop_reason: 'end_turn',
      },
    ])
    const { events, answer } = await run(answerQuestion(EXAMPLE_REPORT, 'Why did ApoB fall?', client))

    expect(events[0]).toEqual({ type: 'status', text: 'Searching the medical literature…' })
    expect(answer.segments).toEqual([
      { text: 'ApoB fell. ', sources: [1] },
      { text: 'Trials saw the same.', sources: [2] },
    ])
    expect(answer.sources.map((source) => source.kind)).toEqual(['report', 'literature'])

    const [first, second] = calls
    expect(first).toMatchObject({
      model: ASSISTANT_MODEL,
      fallbacks: 'default',
      betas: ['server-side-fallback-2026-07-01'],
      tools: [{ type: 'web_search_20260209', name: 'web_search', allowed_domains: LITERATURE_DOMAINS }],
    })
    const [document, question] = (first.messages as { content: Record<string, unknown>[] }[])[0].content
    expect(document).toMatchObject({ type: 'document', citations: { enabled: true }, cache_control: { type: 'ephemeral' } })
    expect(JSON.stringify(document)).not.toContain(EXAMPLE_REPORT.person.name)
    expect(question).toEqual({ type: 'text', text: 'Why did ApoB fall?' })
    // The paused turn goes back as it is, with no new user message.
    expect((second.messages as { role: string }[]).map((message) => message.role)).toEqual(['user', 'assistant'])
  })

  it('says so when Claude declines', async () => {
    const { client } = fakeClient([{ events: [], stop_reason: 'refusal' }])
    const { events } = await run(answerQuestion(EXAMPLE_REPORT, 'A question', client))
    expect(events.at(-1)).toMatchObject({ type: 'error' })
  })
})
