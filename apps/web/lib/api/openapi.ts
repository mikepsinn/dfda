import { z } from 'zod/v4'
import { resourceUrl, tokenIssuer, trackingScopes } from '@/lib/oauth-resources'
import { trackingOperations, type TrackingOperation, type TrackingOperationName } from '@/lib/tracking/operations'

/**
 * OpenAPI 3.1 document of the REST API (app/api/v1). The request schemas are
 * the operations' input schemas, so the document matches what the API checks.
 */

type Route = {
  path: string
  method: 'get' | 'post' | 'patch' | 'delete'
  operation: TrackingOperationName
  /** Path parameter name in the URL, and the input field it fills. */
  pathParam?: { name: string; field: string }
  status?: number
}

const routes: Route[] = [
  { path: '/variables', method: 'get', operation: 'searchVariables' },
  { path: '/variables/{globalVariableId}', method: 'get', operation: 'getVariable', pathParam: { name: 'globalVariableId', field: 'globalVariableId' } },
  { path: '/measurements', method: 'get', operation: 'listMeasurements' },
  { path: '/measurements', method: 'post', operation: 'recordMeasurement', status: 201 },
  { path: '/measurements/{id}', method: 'patch', operation: 'updateMeasurement', pathParam: { name: 'id', field: 'measurementId' } },
  { path: '/measurements/{id}', method: 'delete', operation: 'deleteMeasurement', pathParam: { name: 'id', field: 'measurementId' } },
  { path: '/tracking-reminders', method: 'get', operation: 'listTrackingReminders' },
  { path: '/tracking-reminders', method: 'post', operation: 'upsertTrackingReminder' },
  { path: '/tracking-reminders/{id}', method: 'get', operation: 'getTrackingReminder', pathParam: { name: 'id', field: 'trackingReminderId' } },
  { path: '/tracking-reminders/{id}', method: 'patch', operation: 'upsertTrackingReminder', pathParam: { name: 'id', field: 'trackingReminderId' } },
  { path: '/tracking-reminders/{id}', method: 'delete', operation: 'deleteTrackingReminder', pathParam: { name: 'id', field: 'trackingReminderId' } },
  { path: '/notifications', method: 'get', operation: 'listTrackingReminderNotifications' },
  { path: '/notifications/due', method: 'get', operation: 'listDueTrackingReminders' },
  { path: '/notifications/respond', method: 'post', operation: 'respondToTrackingReminder' },
]

type JsonSchema = { type?: string; properties?: Record<string, JsonSchema>; required?: string[]; description?: string; [key: string]: unknown }

function inputSchema(operation: TrackingOperation, omit?: string): JsonSchema {
  const schema = z.toJSONSchema(operation.input, { io: 'input' }) as JsonSchema
  delete schema.$schema
  if (omit && schema.properties) {
    delete schema.properties[omit]
    schema.required = schema.required?.filter((name) => name !== omit)
  }
  return schema
}

const errorResponse = (description: string) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
})

function describeRoute(route: Route) {
  const operation = trackingOperations[route.operation] as unknown as TrackingOperation
  const parameters: Record<string, unknown>[] = []
  if (route.pathParam) {
    parameters.push({ name: route.pathParam.name, in: 'path', required: true, schema: { type: 'string' } })
  }
  let requestBody: Record<string, unknown> | undefined
  const schema = inputSchema(operation, route.pathParam?.field)
  if (route.method === 'get' || route.method === 'delete') {
    for (const [name, property] of Object.entries(schema.properties ?? {})) {
      parameters.push({
        name,
        in: 'query',
        required: schema.required?.includes(name) ?? false,
        description: property.description,
        schema: { ...property, description: undefined },
      })
    }
  } else {
    let bodySchema: unknown = schema
    if (route.operation === 'respondToTrackingReminder') {
      // One answer (notificationId) or several (notificationIds, or all that are due).
      bodySchema = { oneOf: [schema, inputSchema(trackingOperations.respondToTrackingReminderNotifications as unknown as TrackingOperation)] }
    }
    requestBody = { required: true, content: { 'application/json': { schema: bodySchema } } }
  }
  return {
    operationId: route.method === 'patch' && route.operation === 'upsertTrackingReminder' ? 'updateTrackingReminder' : operation.name,
    summary: operation.title,
    description: operation.description,
    security: [{ oauth2: [operation.scope] }],
    ...(parameters.length > 0 ? { parameters } : {}),
    ...(requestBody ? { requestBody } : {}),
    responses: {
      [String(route.status ?? 200)]: { description: 'Success', content: { 'application/json': { schema: { type: 'object' } } } },
      ...(route.operation === 'upsertTrackingReminder' && route.method === 'post' ? { 201: { description: 'Created' } } : {}),
      400: errorResponse('The input is not valid.'),
      401: errorResponse('No access token, or one that is not valid for this API. WWW-Authenticate names the protected-resource metadata.'),
      403: errorResponse('The access token does not have the scope this needs.'),
      ...(route.pathParam || route.method !== 'get' ? { 404: errorResponse('Not found among your own records.') } : {}),
    },
  }
}

export function openApiDocument() {
  const issuer = tokenIssuer()
  const paths: Record<string, Record<string, unknown>> = {}
  for (const route of routes) {
    paths[route.path] = { ...paths[route.path], [route.method]: describeRoute(route) }
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'Personal tracking API',
      version: '1.0.0',
      description:
        'Measurements, variables, tracking reminders and their notifications of the signed-in user. ' +
        `Get an access token with OAuth 2.1 (PKCE) and the resource parameter set to ${resourceUrl('rest')}. ` +
        'Every request acts on the token user’s own data only.',
    },
    servers: [{ url: resourceUrl('rest') }],
    paths,
    components: {
      securitySchemes: {
        oauth2: {
          type: 'oauth2',
          description: `Send resource=${resourceUrl('rest')} in the authorization and token requests.`,
          flows: {
            authorizationCode: {
              authorizationUrl: `${issuer}/oauth2/authorize`,
              tokenUrl: `${issuer}/oauth2/token`,
              refreshUrl: `${issuer}/oauth2/token`,
              scopes: Object.fromEntries(
                trackingScopes.map((scope) => [
                  scope,
                  scope === 'tracking:read'
                    ? 'Read your measurements, reminders and notifications'
                    : 'Record and change your measurements and reminders, and answer reminders',
                ]),
              ),
            },
          },
        },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} },
            },
          },
        },
      },
    },
  }
}
