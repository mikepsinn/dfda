/**
 * A stand-in for the Claude API in the browser tests, so that they contact no
 * outside service: it answers every streamed Messages request with the same
 * answer, which cites the report and one page of the literature. The app uses
 * it when ANTHROPIC_BASE_URL points here (playwright.config.ts, ci.yml).
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
  req.resume()
  req.on('end', () => {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
    for (const [name, data] of events()) res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
    res.end()
  })
}).listen(port, '127.0.0.1', () => console.log(`Mock Claude API on http://127.0.0.1:${port}`))
