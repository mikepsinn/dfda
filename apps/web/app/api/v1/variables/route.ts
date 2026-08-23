import { NextResponse } from 'next/server'
import { prisma } from '@repo/mysql-database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Convert BigInt values while preserving Date and other JSON-aware objects.
function serializeBigInts(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') return Number(value)
  if (Array.isArray(value)) return value.map(serializeBigInts)
  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) return value

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeBigInts(nestedValue)])
    )
  }
  return value
}

export async function GET() {
  try {
    const rankedVariableIds = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT v.id
      FROM variables v
      INNER JOIN variable_categories c ON c.id = v.variable_category_id
      WHERE v.deleted_at IS NULL
        AND v.is_public = TRUE
        AND v.number_of_user_variables > 2
        AND v.number_of_raw_measurements_with_tags_joins_children > 5
        AND (
          COALESCE(v.number_of_aggregate_correlations_as_cause, 0) > 0
          OR COALESCE(v.number_of_aggregate_correlations_as_effect, 0) > 0
        )
        AND c.deleted_at IS NULL
        AND c.boring = FALSE
      ORDER BY (
        COALESCE(v.number_of_aggregate_correlations_as_cause, 0)
        + COALESCE(v.number_of_aggregate_correlations_as_effect, 0)
      ) DESC,
      v.number_of_user_variables DESC,
      v.id ASC
      LIMIT 500
    `

    const rankedIds = rankedVariableIds.map(({ id }) => id)

    const variables = await prisma.variables.findMany({
      where: {
        id: {
          in: rankedIds,
        },
      },
      include: {
        variable_categories: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const variablesById = new Map(variables.map((variable) => [variable.id, variable]))
    const sortedVariables = rankedIds.flatMap((id) => {
      const variable = variablesById.get(id)
      return variable ? [variable] : []
    })

    // Convert ALL BigInt fields to numbers for JSON serialization
    const serializedVariables = serializeBigInts(sortedVariables)

    return NextResponse.json({ variables: serializedVariables })
  } catch (error) {
    console.error('Error fetching variables:', error)
    return NextResponse.json({ error: 'Failed to fetch variables' }, { status: 500 })
  }
}
