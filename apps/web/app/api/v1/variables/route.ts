import { NextResponse } from 'next/server'
import { prisma } from '@repo/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper function to convert BigInt to Number in nested objects
function serializeBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return Number(obj)
  if (Array.isArray(obj)) return obj.map(serializeBigInts)
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInts(value)])
    )
  }
  return obj
}

export async function GET() {
  try {
    // Get interesting (non-boring) category IDs
    const interestingCategories = await prisma.variable_categories.findMany({
      where: {
        deleted_at: null,
        boring: false,
      },
      select: {
        id: true,
      },
    })

    const interestingCategoryIds = interestingCategories.map((cat) => cat.id)

    const variables = await prisma.variables.findMany({
      where: {
        deleted_at: null,
        is_public: true,
        number_of_user_variables: {
          gt: 2,
        },
        number_of_raw_measurements_with_tags_joins_children: {
          gt: 5,
        },
        OR: [
          {
            number_of_aggregate_correlations_as_cause: {
              gt: 0,
            },
          },
          {
            number_of_aggregate_correlations_as_effect: {
              gt: 0,
            },
          },
        ],
        variable_category_id: {
          in: interestingCategoryIds,
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
      orderBy: [
        {
          number_of_user_variables: 'desc',
        },
      ],
      take: 500, // Limit to 500 for performance
    })

    // Sort by total correlations (cause + effect)
    const sortedVariables = variables.sort((a, b) => {
      const aTotal = (a.number_of_aggregate_correlations_as_cause || 0) + (a.number_of_aggregate_correlations_as_effect || 0)
      const bTotal = (b.number_of_aggregate_correlations_as_cause || 0) + (b.number_of_aggregate_correlations_as_effect || 0)
      return bTotal - aTotal
    })

    // Convert ALL BigInt fields to numbers for JSON serialization
    const serializedVariables = serializeBigInts(sortedVariables)

    return NextResponse.json({ variables: serializedVariables })
  } catch (error) {
    console.error('Error fetching variables:', error)
    return NextResponse.json({ error: 'Failed to fetch variables' }, { status: 500 })
  }
}
