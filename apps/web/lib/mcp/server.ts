import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { logger } from '@/lib/logger'
import { TrackingError } from '@/lib/tracking/errors'
import { trackingOperations, type TrackingOperation } from '@/lib/tracking/operations'

const instructions = [
  'Personal health tracking: record measurements (symptoms, doses, foods, moods, sleep, vital signs), manage tracking reminders and answer them.',
  'Every tool acts on the signed-in user’s own data. Use searchVariables to find a variable id, and listDueTrackingReminders for reminders to answer.',
].join(' ')

function textResult(value: unknown, isError = false): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], ...(isError ? { isError: true } : {}) }
}

/**
 * The MCP server for one request of `userId`: one tool per tracking operation
 * that the token's scopes allow.
 */
export function createTrackingMcpServer(userId: string, scopes: string[]) {
  const server = new McpServer({ name: 'tracking', version: '1.0.0' }, { capabilities: { tools: {} }, instructions })

  for (const operation of Object.values(trackingOperations) as unknown as TrackingOperation[]) {
    if (!scopes.includes(operation.scope)) continue
    server.registerTool(
      operation.name,
      {
        title: operation.title,
        description: operation.description,
        inputSchema: operation.input,
        annotations: {
          title: operation.title,
          readOnlyHint: operation.scope === 'tracking:read',
          destructiveHint: operation.destructive ?? false,
          openWorldHint: false,
        },
      },
      async (args: Record<string, unknown>) => {
        try {
          return textResult(await operation.run(userId, args))
        } catch (error) {
          if (error instanceof TrackingError) return textResult({ error: { code: error.code, message: error.message } }, true)
          logger.error('MCP tool failed', { tool: operation.name, error: error instanceof Error ? error.message : String(error) })
          return textResult({ error: { code: 'INTERNAL', message: 'The tool failed. Try again later.' } }, true)
        }
      },
    )
  }
  return server
}
