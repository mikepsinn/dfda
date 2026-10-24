/**
 * A stand-in for the Claude API in the browser tests, so that they contact no
 * outside service. It answers every streamed Messages request (the report
 * assistant) with the same answer, which cites the report and one page of the
 * literature. It answers the check-in chat (lib/programs/chat.ts, not
 * streamed) with a record_values call for the first rating of the program,
 * and then with MOCK_CHAT.reply. The app uses it when ANTHROPIC_BASE_URL
 * points here (playwright.config.ts, ci.yml).
 *
 * Usage: node tests/e2e/mock-claude.mjs [port]   (default 4010)
 */
import { createServer } from 'node:http'

export const MOCK_ANSWER = {
  report: 'The report shows a change beyond this person’s own noise. ',
  literature: 'Studies of the program’s drug report the same direction of change.',
  sourceTitle: 'Example study of the program’s drug',
  sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/00000000/',
}

export const MOCK_CHAT = { value: 3, reply: 'Thank you. I saved it for today.' }

/** The chat's answer: first a record_values call, then, after its result, a short text. */
function chatMessage(body) {
  const last = body.messages.at(-1)
  const answered = Array.isArray(last?.content) && last.content.some((block) => block.type === 'tool_result')
  const system = (body.system ?? []).map((block) => block.text).join('\n')
  // A new id for each reply: the next turn of the thread continues from it.
  // The first rating in the program's list of items, such as "- Nausea: rating 0 to 10".
  const item = /^- (.+?): rating /m.exec(system)?.[1] ?? 'Energy'
  const content = answered
    ? [{ type: 'text', text: MOCK_CHAT.reply }]
    : [{ type: 'tool_use', id: 'toolu_mock', name: 'record_values', input: { values: [{ item, value: MOCK_CHAT.value }] } }]
  return {
    id: `msg_mock_chat_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: 'message',
    role: 'assistant',
    model: body.model,
    content,
    stop_reason: answered ? 'end_turn' : 'tool_use',
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  }
}

function events() {
  const text = (index, citation, value) => [
    ['content_block_start', { type: 'content_block_start', index, content_block: { type: 'text', text: '', citations: null } }],
    ['content_block_delta', { type: 'content_block_delta', index, delta: { type: 'citations_delta', citation } }],
    ['content_block_delta', { type: 'content_block_delta', index, delta: { type: 'text_delta', text: value } }],
    ['content_block_stop', { type: 'content_block_stop', index }],
  ]
  return [
    [
      'message_start',
      {
        type: 'message_start',
        message: {
          id: 'msg_mock',
          type: 'message',
          role: 'assistant',
          model: 'claude-opus-5-5',
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 1, output_tokens: 0 },
        },
      },
    ],
    ...text(
      0,
      // A line that every report document has (lib/care-team/assistant.ts reportDocument).
      { type: 'char_location', cited_text: 'Each list of values below follows this order.', document_index: 0, document_title: 'Biomarker report', start_char_index: 0, end_char_index: 46 },
      MOCK_ANSWER.report,
    ),
    ...text(
      1,
      { type: 'web_search_result_location', cited_text: 'The same direction of change.', title: MOCK_ANSWER.sourceTitle, url: MOCK_ANSWER.sourceUrl, encrypted_index: 'mock' },
      MOCK_ANSWER.literature,
    ),
    ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 1 } }],
    ['message_stop', { type: 'message_stop' }],
  ]
}

const port = Number(process.argv[2] ?? 4010)
createServer((req, res) => {
  if (req.method !== 'POST' || !req.url?.startsWith('/v1/messages')) {
    res.writeHead(404, { 'content-type': 'application/json' }).end(JSON.stringify({ type: 'error', error: { type: 'not_found_error', message: 'Not found' } }))
    return
  }
  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', () => {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
    // The chat's tool runner sends its turns on a message thread: the turn after a tool call
    // has only the tool's result, without the system prompt and the tools.
    if (!body.stream) {
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(chatMessage(body)))
      return
    }
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
    for (const [name, data] of events()) res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
    res.end()
  })
}).listen(port, '127.0.0.1', () => console.log(`Mock Claude API on http://127.0.0.1:${port}`))
