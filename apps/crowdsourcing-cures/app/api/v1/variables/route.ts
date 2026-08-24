import { NextResponse } from "next/server"

import {
  getPublicVariableCategories,
  getPublicVariables,
  isDiscoverablePublicVariable,
  toVariableListItem,
} from "@/lib/dfda/public-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [variables, categories] = await Promise.all([
      getPublicVariables({ concise: true, limit: 200 }),
      getPublicVariableCategories(),
    ])
    const discoverableCategoryNames = new Set(
      categories.map((category) => category.name)
    )
    const rankedVariables = variables
      .filter(
        (variable) =>
          isDiscoverablePublicVariable(variable) &&
          discoverableCategoryNames.has(variable.variableCategoryName ?? "")
      )
      .sort((left, right) => {
        const leftStudies =
          (left.numberOfAggregateCorrelationsAsCause ?? 0) +
          (left.numberOfAggregateCorrelationsAsEffect ?? 0)
        const rightStudies =
          (right.numberOfAggregateCorrelationsAsCause ?? 0) +
          (right.numberOfAggregateCorrelationsAsEffect ?? 0)

        return (
          rightStudies - leftStudies ||
          (right.numberOfUserVariables ?? 0) -
            (left.numberOfUserVariables ?? 0) ||
          left.id - right.id
        )
      })
      .map(toVariableListItem)

    return NextResponse.json({ variables: rankedVariables })
  } catch (error) {
    console.error("Error fetching variables from the DFDA API:", error)
    return NextResponse.json(
      { error: "Failed to fetch variables" },
      { status: 502 }
    )
  }
}
