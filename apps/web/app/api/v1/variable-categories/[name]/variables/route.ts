import { NextResponse } from 'next/server'
import { prisma } from '@repo/mysql-database'
import { slugToName } from '@/lib/slugs'

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

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const categoryKey = decodeURIComponent(params.name)
    const categoryName = slugToName(categoryKey)
    const categoryId = /^\d+$/.test(categoryKey) ? Number.parseInt(categoryKey, 10) : null

    // Get the category
    const category = await prisma.variable_categories.findFirst({
      where: {
        deleted_at: null,
        is_public: true,
        ...(categoryId === null
          ? { OR: [{ slug: categoryKey }, { name: categoryName }] }
          : { id: categoryId }),
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const rankedVariableIds = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id
      FROM variables
      WHERE variable_category_id = ${category.id}
        AND deleted_at IS NULL
        AND is_public = TRUE
        AND number_of_user_variables > 2
        AND number_of_raw_measurements_with_tags_joins_children > 5
        AND (
          COALESCE(number_of_aggregate_correlations_as_cause, 0) > 0
          OR COALESCE(number_of_aggregate_correlations_as_effect, 0) > 0
        )
      ORDER BY (
        COALESCE(number_of_aggregate_correlations_as_cause, 0)
        + COALESCE(number_of_aggregate_correlations_as_effect, 0)
      ) DESC,
      number_of_user_variables DESC,
      id ASC
      LIMIT 200
    `

    const rankedIds = rankedVariableIds.map(({ id }) => id)
    const variables = await prisma.variables.findMany({
      where: { id: { in: rankedIds } },
    })
    const variablesById = new Map(variables.map((variable) => [variable.id, variable]))
    const sortedVariables = rankedIds.flatMap((id) => {
      const variable = variablesById.get(id)
      return variable ? [variable] : []
    })

    // Convert ALL BigInt fields to numbers for JSON serialization
    const serializedVariables = serializeBigInts(sortedVariables)

    return NextResponse.json({
      category: serializeBigInts(category),
      variables: serializedVariables,
    })
  } catch (error) {
    console.error('Error fetching category variables:', error)
    return NextResponse.json({ error: 'Failed to fetch variables' }, { status: 500 })
  }
}
